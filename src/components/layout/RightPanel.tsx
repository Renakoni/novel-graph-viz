import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

type RightPanelProps = {
  children: ReactNode;
  isVisible: boolean;
  panelKey?: string;
  title?: string;
  kicker?: string;
  onClose: () => void;
};

export function RightPanel({
  children,
  isVisible,
  panelKey,
  title = "详情",
  kicker = "Details",
  onClose,
}: RightPanelProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {isVisible ? (
        <motion.aside
          key={panelKey}
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ duration: 0.17, ease: [0.22, 1, 0.36, 1] }}
          className="detail-panel"
        >
          <div className="detail-panel__chrome">
            <div>
              <div className="panel-kicker">{kicker}</div>
              <h2 className="panel-title">{title}</h2>
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
