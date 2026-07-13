import { LucideIcon, Settings, BarChart3, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  isEditable?: boolean;
  onEdit?: () => void;
  hasCalculator?: boolean;
}

// 1. LOGIQUE NY ANIMATION DINAMIC SY MIFANDIMBY
const containerVariants = {
  initial: {},
  hover: {
    transition: {
      staggerChildren: 0.15, // Elanelana (0.15s) mba ho hita tsara ny fifandimbiasana
    }
  }
};

const buttonVariants = {
  initial: { 
    opacity: 0, 
    y: 15,        // Avy any ambany kokoa izy no miakatra
    scale: 0.6    // Kely kokoa amin'ny voalohany
  },
  hover: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 400, // Haingana be ny fiakarany (Dynamic)
      damping: 12     // Kely ny damping mba hisian'ilay "rebound/bounce" kely eo an-tampony
    }
  }
};

export const StatsCard = ({ title, value, icon: Icon, color, isEditable, onEdit, hasCalculator }: StatsCardProps) => (
  <motion.div 
    initial="initial"
    whileHover="hover" 
    animate="initial"
    variants={containerVariants}
    className="group relative bg-[#1e1510]/60 backdrop-blur-md border border-white/5 p-8 rounded-[2rem] shadow-xl border-l-4 border-[#a67c52]"
  >
    {/* Bokotra Statistiques - HOVER MODE (Ho an'ny TRADES ihany) */}
    {title === "TRADES" && (
      <Link href="/statistics" passHref legacyBehavior>
        <motion.button 
          variants={buttonVariants}
          whileHover={{ scale: 1.15, y: -2 }} // Nampiana ilay effet dynamique rehefa hover-na mivantana
          whileTap={{ scale: 0.95 }}          // Effet kely rehefa klikena
          className="absolute top-4 right-4 p-2 bg-[#a67c52]/10 hover:bg-[#a67c52]/20 rounded-xl text-[#a67c52] border border-[#a67c52]/20 shadow-lg flex items-center justify-center transition-colors z-20"
          title="Voir les statistiques détaillées"
        >
          <BarChart3 size={18} strokeWidth={2.5} />
        </motion.button>
      </Link>
    )}

    {/* CONTAINER HO AN'NY ICONS HOVER (Settings sy Calculatrice) */}
    <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
      
      {/* Bokotra vaovao ho an'ny Calculatrice (Raha TRUE ny hasCalculator) */}
      {hasCalculator && (
        <Link href="/calculator" passHref legacyBehavior>
          <motion.button 
            variants={buttonVariants}
            whileHover={{ scale: 1.15, y: -2 }} 
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-[#a67c52]/10 hover:bg-[#a67c52]/20 rounded-xl text-[#a67c52] border border-[#a67c52]/20 shadow-lg flex items-center justify-center transition-colors"
            title="Ouvrir la calculatrice Money Management"
          >
            <Calculator size={14} />
          </motion.button>
        </Link>
      )}

      {/* Bokotra Settings (Modifier le capital) */}
      {isEditable && (
        <motion.button 
          variants={buttonVariants}
          whileHover={{ scale: 1.15, y: -2 }} 
          whileTap={{ scale: 0.95 }}
          onClick={onEdit}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-[#a67c52] flex items-center justify-center transition-colors"
          title="Modifier le capital"
        >
          <Settings size={14} />
        </motion.button>
      )}
    </div>

    <div className="flex justify-between items-start">
      <div>
        <p className="text-[#a67c52] text-[10px] font-black tracking-[0.2em] uppercase opacity-70 mb-2">{title}</p>
        <h3 className={`text-3xl font-black tracking-tight ${color}`}>{value}</h3>
      </div>
      <div className="p-3 bg-[#3d2b1f] rounded-2xl text-[#a67c52] shadow-inner">
        <Icon size={22}/>
      </div>
    </div>
  </motion.div>
);