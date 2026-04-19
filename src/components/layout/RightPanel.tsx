import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

type RightPanelProps = {
  children: ReactNode;
  isVisible: boolean;
  onClose: () => void;
};

export function RightPanel({ children, isVisible, onClose }: RightPanelProps) {
  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.aside
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 240 }}
          className="detail-panel"
        >
          <div className="detail-panel__chrome">
            <div>
              <div className="panel-kicker">Details</div>
              <h2 className="panel-title">人物详情</h2>
            </div>
            <button
              className="detail-panel__close"
              onClick={onClose}
              aria-label="关闭详情"
            >
              <X size={18} />
            </button>
          </div>
          <div className="custom-scrollbar detail-panel__body">{children}</div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
