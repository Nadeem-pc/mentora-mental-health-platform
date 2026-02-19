import React from 'react';
import { motion } from 'framer-motion';
import { Users, Lock, Calendar, MessageCircle, Target, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  Icon: LucideIcon;
  title: string;
  description: string;
  bgColor: string;
  bgPattern: string;
  textColor: string;
}

const features: Feature[] = [
  {
    Icon: Users,
    title: "Individual Therapy",
    description: "One-on-one sessions with licensed therapists tailored to your specific needs and goals.",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    bgPattern: "blue",
    textColor: "text-blue-600 dark:text-blue-400"
  },
  {
    Icon: Lock,
    title: "Complete Privacy",
    description: "End-to-end encryption and strict confidentiality ensure your conversations remain private.",
    bgColor: "bg-teal-50 dark:bg-teal-950/20",
    bgPattern: "teal",
    textColor: "text-teal-600 dark:text-teal-400"
  },
  {
    Icon: Calendar,
    title: "Flexible Scheduling",
    description: "Book sessions that fit your schedule with our easy-to-use appointment system.",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    bgPattern: "green",
    textColor: "text-green-600 dark:text-green-400"
  },
  {
    Icon: MessageCircle,
    title: "Multiple Formats",
    description: "Choose from video calls, phone sessions, or secure messaging based on your comfort level.",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    bgPattern: "purple",
    textColor: "text-purple-600 dark:text-purple-400"
  },
  {
    Icon: Target,
    title: "Specialized Care",
    description: "Access therapists who specialize in anxiety, depression, trauma, relationships, and more.",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    bgPattern: "indigo",
    textColor: "text-indigo-600 dark:text-indigo-400"
  },
  {
    Icon: Sparkles,
    title: "AI Assistant",
    description: "Get personalized therapist recommendations powered by AI based on your unique needs and preferences.",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
    bgPattern: "cyan",
    textColor: "text-cyan-600 dark:text-cyan-400"
  }
];

const Features: React.FC = () => {
  // Duplicate arrays for seamless infinite scroll - all 6 cards in one row
  const featuresDuplicated = [...features, ...features];

  const getPatternColor = (pattern: string) => {
    const colors: Record<string, string> = {
      blue: "rgba(59, 130, 246, 0.15)",
      teal: "rgba(20, 184, 166, 0.15)",
      green: "rgba(34, 197, 94, 0.15)",
      purple: "rgba(168, 85, 247, 0.15)",
      indigo: "rgba(99, 102, 241, 0.15)",
      cyan: "rgba(6, 182, 212, 0.15)"
    };
    return colors[pattern] || colors.blue;
  };

  const renderCard = (feature: Feature, index: number) => (
    <motion.div
      key={index}
      className={`group relative ${feature.bgColor} backdrop-blur-sm rounded-3xl w-[320px] h-[360px] flex flex-col overflow-hidden flex-shrink-0 border border-white/20 dark:border-gray-700/30`}
      style={{
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)'
      }}
      whileHover={{ 
        scale: 1.03,
        y: -8,
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.08)'
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }}
    >
      {/* Abstract Background Pattern */}
      <div 
        className="absolute inset-0 opacity-40 dark:opacity-20 transition-opacity duration-300 group-hover:opacity-60"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, ${getPatternColor(feature.bgPattern)} 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, ${getPatternColor(feature.bgPattern)} 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, ${getPatternColor(feature.bgPattern)} 0%, transparent 70%)
          `
        }}
      />

      {/* Gradient border glow on hover */}
      <motion.div 
        className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        style={{
          background: `linear-gradient(135deg, ${getPatternColor(feature.bgPattern)}, transparent, ${getPatternColor(feature.bgPattern)})`,
          padding: '2px',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude'
        }}
      />

      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          style={{
            animation: 'shine 1.5s ease-in-out infinite',
            transform: 'translateX(-100%)'
          }}
        />
      </div>

      {/* Content Container with proper padding */}
      <div className="relative flex flex-col h-full pt-8 px-8 pb-8 z-10">
        {/* Top section: Icon and Title */}
        <div className="flex-shrink-0">
          {/* Icon with enhanced effects */}
          <motion.div 
            className="mb-6"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${
              feature.bgPattern === 'blue' ? 'from-blue-500 via-blue-600 to-blue-700' : 
              feature.bgPattern === 'teal' ? 'from-teal-500 via-teal-600 to-teal-700' : 
              feature.bgPattern === 'green' ? 'from-green-500 via-green-600 to-green-700' : 
              feature.bgPattern === 'purple' ? 'from-purple-500 via-purple-600 to-purple-700' : 
              feature.bgPattern === 'indigo' ? 'from-indigo-500 via-indigo-600 to-indigo-700' : 
              'from-cyan-500 via-cyan-600 to-cyan-700'
            } flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300`}>
              {/* Icon glow */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${
                feature.bgPattern === 'blue' ? 'from-blue-400 to-blue-600' : 
                feature.bgPattern === 'teal' ? 'from-teal-400 to-teal-600' : 
                feature.bgPattern === 'green' ? 'from-green-400 to-green-600' : 
                feature.bgPattern === 'purple' ? 'from-purple-400 to-purple-600' : 
                feature.bgPattern === 'indigo' ? 'from-indigo-400 to-indigo-600' : 
                'from-cyan-400 to-cyan-600'
              } opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300`} />
              
              <feature.Icon className="w-8 h-8 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" strokeWidth={2.5} />
            </div>
          </motion.div>

          {/* Title with hover effect */}
          <h3 className={`text-xl font-bold mb-4 leading-tight transition-colors duration-300 ${
            feature.textColor
          } group-hover:scale-105 transform transition-transform duration-300`}>
            {feature.title}
          </h3>
        </div>

        {/* Description - properly spaced from bottom */}
        <div className="flex-1 flex flex-col justify-start overflow-hidden">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-4 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-300" style={{ 
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            wordBreak: 'break-word'
          }}>
            {feature.description}
          </p>
        </div>

        {/* Decorative corner accent */}
        <div className={`absolute bottom-0 right-0 w-24 h-24 opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${
          feature.bgPattern === 'blue' ? 'bg-blue-500' : 
          feature.bgPattern === 'teal' ? 'bg-teal-500' : 
          feature.bgPattern === 'green' ? 'bg-green-500' : 
          feature.bgPattern === 'purple' ? 'bg-purple-500' : 
          feature.bgPattern === 'indigo' ? 'bg-indigo-500' : 
          'bg-cyan-500'
        } rounded-tl-full blur-2xl`} />
      </div>
    </motion.div>
  );

  return (
    <section id="services" className="relative py-24 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full">
        <motion.div 
          className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-teal-200/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-br from-green-200/20 to-teal-200/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.35, 0.2]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6">
            Comprehensive Mental Health
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600">
              Services
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            We offer a wide range of mental health services designed to support you 
            on your journey to better mental wellbeing.
          </p>
        </motion.div>
      </div>

      {/* Single Row Carousel - Right to Left - Full Width */}
      <div className="overflow-hidden relative w-screen -ml-[50vw] left-1/2 py-8">
        <motion.div
          className="flex will-change-transform"
          style={{ gap: '32px', paddingLeft: '32px', paddingTop: '8px', paddingBottom: '8px' }}
          animate={{
            x: [0, -(320 + 32) * features.length]
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 40,
              ease: "linear"
            }
          }}
        >
          {featuresDuplicated.map((feature, index) => renderCard(feature, index))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;