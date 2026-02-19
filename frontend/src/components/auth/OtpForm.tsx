import { OtpSchema } from '@/schemas/authSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import type z from 'zod';
import { Form } from '../ui/form';
import { toast } from 'sonner';
import { AuthService } from '@/services/shared/authServices';
import { Button } from '../ui/button';
import { useAuth } from '@/contexts/auth.context';

const OtpForm: React.FC = () => {
    const [otp, setOtp] = useState<string[]>(['', '', '', '']);
    const [timer, setTimer] = useState<number>(60);
    const [canResend, setCanResend] = useState<boolean>(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            
            return () => clearInterval(interval);
        } else {
            setCanResend(true);
        }
    }, [timer]);

    const handleChange = (index: number, value: string): void => {
        if (value.length > 1) return;
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 4);
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = [...otp];
        for (let i = 0; i < pastedData.length && i < 4; i++) {
            newOtp[i] = pastedData[i];
        }
        setOtp(newOtp);
        
        const nextIndex = Math.min(pastedData.length, 3);
        inputRefs.current[nextIndex]?.focus();
    };

    const handleResend = async (): Promise<void> => {
        if (!canResend) return;
        setOtp(['', '', '', '']);
        form.setValue("otp", "");
        setTimer(60);
        setCanResend(false);
        inputRefs.current[0]?.focus();
        const response = await AuthService.resendOtp(email);
        if(response.success){
            toast.success(response.message);
        }else{
            toast.error(response.message);
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const navigate = useNavigate();
    const location = useLocation();
    const { setUser } = useAuth();
    const email:string = location.state;

    const form = useForm<z.infer<typeof OtpSchema>>({
        resolver: zodResolver(OtpSchema),
        defaultValues: {
            otp: "",
        },
    })

    const onSubmit = async (data: z.infer<typeof OtpSchema>) => {
        if(timer === 0) toast.error("OTP has expired. Please request a new one.")
        try {
            const response = await AuthService.verifyOtp({ email, ...data });
            if(response && response.user && response.accessToken){
                localStorage.setItem("accessToken", response.accessToken);
                setUser(response.user);
                toast.success('Registration successful');

                if(response.user.role === 'client'){
                    navigate('/', { replace: true });
                }else{
                    navigate('/therapist/dashboard', { replace: true });
                }
                
                localStorage.removeItem('role');
            }else{
                toast.error(response.message || "Failed to resend OTP");
            }
        } catch (error: unknown) {
            console.error(error);
            const errorMessage =
              typeof error === 'object' &&
              error !== null &&
              'response' in error &&
              typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === 'string'
                ? ((error as { response?: { data?: { message?: string } } }).response?.data?.message as string)
                : "Failed to resend OTP";
            toast.error(errorMessage)
        }
    }

    return (
        <div className=''>
            <div className="text-center mb-6">
                <p className="text-white text-sm">Enter the 4-digit verification code sent to {email}</p>
            </div>
            
            <Form {...form}>
                <form onSubmit={(e) => {
                    form.setValue("otp", otp.join(""));
                    form.handleSubmit(onSubmit)(e);
                }}>

                    <div className="flex justify-center gap-3 mb-8">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => {
                                    inputRefs.current[index] = el;
                                }}
                                type="text"
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={index === 0 ? handlePaste : undefined}
                                className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-white/80 transition-all duration-200"
                                maxLength={1}
                                autoComplete="off"
                            />
                        ))}  
                    </div>
                    
                    <div className="space-y-3">
                        <Button 
                            type='submit'
                            disabled={otp.join('').length !== 4}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200"
                        >
                            VERIFY OTP
                        </Button>
                        
                        <Button 
                            onClick={handleResend}
                            disabled={!canResend}
                            className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-700 font-medium rounded-lg transition-colors duration-200"
                        >
                            {canResend ? 'RESEND OTP' : `RESEND OTP (${formatTime(timer)})`}
                        </Button>
                    </div>
                </form>    
            </Form>
            
            <p className="text-center text-[12px] text-white/80 mt-4">
                Didn't receive the code? Check your spam folder.
            </p>
        </div> 
    );
};

export default OtpForm;