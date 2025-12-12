import { type ComponentType, type SVGProps } from "react";
import classNames from "classnames";
import { motion } from "framer-motion";

interface ToolCardProps {
    label: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    status: string;
    busy?: boolean;
    onClick: () => void;
    description?: string;
    gradient?: string;
}

export function ToolCard({
    label,
    icon: Icon,
    status,
    busy,
    onClick,
    description,
    gradient = "from-emerald-500/10 via-transparent to-cyan-500/10",
}: ToolCardProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="group relative w-full overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 p-5 text-left transition-all hover:border-emerald-500/30 hover:shadow-glow backdrop-blur-sm"
        >
            <div className={classNames("absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100", gradient)} />

            <div className="relative flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="rounded-xl border border-white/10 bg-slate-800/50 p-3 shadow-inner group-hover:border-emerald-500/30 group-hover:shadow-glow transition-all duration-300">
                        <Icon className="h-6 w-6 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-100 group-hover:text-white transition-colors">{label}</h3>
                        {description && <p className="text-xs text-slate-400 mt-1 line-clamp-1 group-hover:text-slate-300 transition-colors">{description}</p>}
                        <p className="mt-2 text-[10px] uppercase tracking-wider font-medium text-emerald-500/80 group-hover:text-emerald-400 transition-colors">
                            {status}
                        </p>
                    </div>
                </div>

                {busy && (
                    <div className="absolute top-0 right-0 h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                )}
            </div>
        </motion.button>
    );
}
