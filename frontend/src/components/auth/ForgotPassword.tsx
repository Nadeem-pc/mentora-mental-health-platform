import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import FormField from '../ui/Formfield';
import { useForm } from 'react-hook-form';
import type z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema } from '@/schemas/authSchema';
import { toast } from 'sonner';
import { AuthService } from '@/services/shared/authServices';
import { useState } from 'react';
import { Form } from '../ui/form';
import { useNavigate } from 'react-router-dom';


const ForgotPassword: React.FC = () => {

    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
      const [success, setSuccess] = useState(false);

    const form = useForm<z.infer<typeof forgotPasswordSchema>>({
        resolver: zodResolver(forgotPasswordSchema),
        mode: "onChange",
        defaultValues: { email: "" }
    });

    const onSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
        try {
            setIsLoading(true);
            const response = await AuthService.forgotPassword(data);
            if(response.message){
                setTimeout(() => {
                    setIsLoading(false);
                    toast.success(response.message);
                    setSuccess(true);
                }, 800);
            }else {
                setIsLoading(false);
                toast.error(response?.error || 'Sending reset link failed')
            }
        } catch (error: unknown) {
            setTimeout(() => {
                setIsLoading(false);
                const message =
                  typeof error === 'object' &&
                  error !== null &&
                  'response' in error &&
                  typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === 'string'
                    ? ((error as { response?: { data?: { message?: string } } }).response?.data?.message as string)
                    : null;
                if (message) {
                    toast.error(message);
                } else {
                    toast.error("Something went wrong");
                }
            }, 1000);
            console.error(error);
        }
    };


    if (success) {
        return (
            <div className="w-full max-w-md mx-auto">
                <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                
                <h2 className="text-2xl text-white mb-4">
                    Check your email
                </h2>
                
                <p className="text-white/80 mb-4">
                    We've sent a password reset link to{' '}
                    <span className="font-bold text-white/90">{form.getValues("email")}</span>
                </p>
                
                <p className="text-[12px] text-white/80 mb-8">
                    Didn't receive the email? Check your spam folder.
                </p>
                
                <button
                    onClick={() => navigate(-1)}
                    className="w-full btn-primary text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail className="w-8 h-8 text-green-600" />
                </div>
                
                <h1 className="text-2xl text-white mb-2">
                    Forgot Password?
                </h1>
                
                <p className="text-white/80 ">
                    Enter your email address and we'll send you a reset link.
                </p>
            </div>

            <div className="space-y-8">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <div className="relative">
                                <FormField control={form.control} type="email" name="email" label="Email" placeholder="Enter your email" />                
                                <Mail className="absolute right-3 top-1.5 w-5 h-5 text-gray-400" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Sending reset link...
                                </div>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>
                </Form>
            </div>

            <div className="mt-6 text-center">
                <button
                    onClick={() => navigate(-1)}
                    className="text-green-600 hover:text-green-700 font-medium text-sm transition-colors duration-200 flex items-center justify-center gap-1 mx-auto"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                </button>
            </div>
        </div>
    );
};

export default ForgotPassword;