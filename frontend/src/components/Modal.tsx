import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <section role="dialog" tabIndex={-1} className="slds-modal slds-fade-in-open">
        <div className="slds-modal__container">
          <header className="slds-modal__header">
            <button className="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse" onClick={onClose}>
              <span className="slds-assistive-text">Close</span>✕
            </button>
            <h2 className="slds-text-heading_medium slds-hyphenate">{title}</h2>
          </header>
          <div className="slds-modal__content slds-p-around_medium" style={{ overflow: 'auto' }}>
            {children}
          </div>
          {footer && (
            <footer className="slds-modal__footer">
              {footer}
            </footer>
          )}
        </div>
      </section>
      <div className="slds-backdrop slds-backdrop_open" onClick={onClose}></div>
    </>
  );
}
