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
            <button
              className="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse"
              onClick={onClose}
              title="Close"
            >
              <svg className="slds-button__icon slds-button__icon_large" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.36 5.64a1 1 0 00-1.41 0L12 10.59 7.05 5.64a1 1 0 10-1.41 1.41L10.59 12l-4.95 4.95a1 1 0 101.41 1.41L12 13.41l4.95 4.95a1 1 0 001.41-1.41L13.41 12l4.95-4.95a1 1 0 000-1.41z" />
              </svg>
              <span className="slds-assistive-text">Close</span>
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
