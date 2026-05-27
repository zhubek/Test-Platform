"use client";

import { useState, useRef, useEffect, useCallback, forwardRef } from "react";
import { createPortal } from "react-dom";
import { X, Mail, Phone, Globe, Info } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import {
  institutionDetails,
  type InstitutionDetail,
} from "../../_components/mock-data";

interface Props {
  name: string;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export function InstitutionInfoButton({ name }: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const btnRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const detail = institutionDetails[name];

  const handleOpen = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!btnRef.current) return;

      if (!isMobile) {
        const rect = btnRef.current.getBoundingClientRect();
        const tipWidth = 340;
        const tipEstHeight = 320;

        let left = rect.right + 8;
        let top = rect.top - 20;

        // Keep within viewport
        if (left + tipWidth > window.innerWidth - 12) {
          left = rect.left - tipWidth - 8;
        }
        if (top + tipEstHeight > window.innerHeight - 12) {
          top = window.innerHeight - tipEstHeight - 12;
        }
        if (top < 12) top = 12;

        setPosition({ top, left });
      }
      setOpen(true);
    },
    [isMobile],
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        tipRef.current &&
        !tipRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    // Delay to avoid immediate close from the same click
    const timer = setTimeout(
      () => document.addEventListener("click", handleClick),
      10,
    );
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClick);
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (!open || !isMobile) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, isMobile]);

  if (!detail) return null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-300 text-gray-600 text-[0.5rem] font-bold shrink-0 transition-colors hover:bg-blue-600 hover:text-white ml-1.5"
        title={`Info about ${name}`}
      >
        <Info className="w-2.5 h-2.5" />
      </button>

      {open &&
        createPortal(
          isMobile ? (
            <MobileSheet
              ref={tipRef}
              name={name}
              detail={detail}
              onClose={() => setOpen(false)}
            />
          ) : (
            <InstitutionTooltip
              ref={tipRef}
              name={name}
              detail={detail}
              position={position}
              onClose={() => setOpen(false)}
            />
          ),
          document.body,
        )}
    </>
  );
}

interface TooltipProps {
  name: string;
  detail: InstitutionDetail;
  position: { top: number; left: number };
  onClose: () => void;
}

const InstitutionTooltip = forwardRef<HTMLDivElement, TooltipProps>(
  function InstitutionTooltip({ name, detail, position, onClose }, ref) {
    return (
      <div
        ref={ref}
        className="fixed z-[300] w-[340px] bg-white rounded-2xl shadow-[0_8px_40px_-8px_rgb(0_0_0/0.12),0_4px_16px_-4px_rgb(0_0_0/0.06)] overflow-hidden animate-[tooltipIn_0.2s_cubic-bezier(0.16,1,0.3,1)]"
        style={{ top: position.top, left: position.left }}
        onClick={(e) => e.stopPropagation()}
      >
        <TooltipContent name={name} detail={detail} onClose={onClose} />

        <style>{`
          @keyframes tooltipIn {
            from { opacity: 0; transform: scale(0.96); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    );
  },
);

interface SheetProps {
  name: string;
  detail: InstitutionDetail;
  onClose: () => void;
}

const MobileSheet = forwardRef<HTMLDivElement, SheetProps>(
  function MobileSheet({ name, detail, onClose }, ref) {
    return (
      <div
        className="fixed inset-0 z-[300] flex items-end justify-center animate-[backdropIn_0.2s_ease]"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Sheet */}
        <div
          ref={ref}
          className="relative w-full max-h-[85vh] bg-white rounded-t-2xl overflow-y-auto animate-[sheetUp_0.3s_cubic-bezier(0.16,1,0.3,1)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-white z-10">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>

          <TooltipContent name={name} detail={detail} onClose={onClose} />
        </div>

        <style>{`
          @keyframes backdropIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes sheetUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  },
);

function TooltipContent({
  name,
  detail,
  onClose,
}: {
  name: string;
  detail: InstitutionDetail;
  onClose: () => void;
}) {
  const { t } = useLocale();
  return (
    <>
      {/* Photo header */}
      <div className="w-full h-[100px] bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center text-[2.2rem] relative">
        {detail.photo}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/85 flex items-center justify-center text-gray-500 hover:bg-white hover:text-gray-900 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-4">
        <div className="text-[0.9rem] font-bold text-gray-900 mb-0.5">
          {name}
        </div>
        <div className="text-xs text-gray-400 mb-0.5">
          {detail.city}
        </div>
        <div className="text-xs text-gray-500 leading-snug mb-3">
          {detail.address}
        </div>

        {/* Contacts */}
        <div className="mb-3">
          <div className="text-[0.6875rem] font-bold text-gray-400 uppercase tracking-wider mb-2">
            {t("professionDetail.institution.contacts")}
          </div>
          <div className="flex flex-col gap-1.5">
            {detail.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <a
                  href={`mailto:${detail.email}`}
                  className="text-blue-600 hover:underline truncate"
                >
                  {detail.email}
                </a>
              </div>
            )}
            {detail.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                {detail.phone}
              </div>
            )}
            {detail.website && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <a
                  href={detail.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  {detail.website.replace("https://", "")}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Social Networks */}
        {(detail.instagram || detail.facebook || detail.youtube) && (
          <div>
            <div className="text-[0.6875rem] font-bold text-gray-400 uppercase tracking-wider mb-2">
              {t("professionDetail.institution.social")}
            </div>
            <div className="flex gap-2">
              {detail.instagram && (
                <a
                  href={`https://instagram.com/${detail.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Instagram"
                  className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center transition-colors hover:bg-gray-100"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4">
                    <path
                      fill="#E4405F"
                      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                    />
                  </svg>
                </a>
              )}
              {detail.facebook && (
                <a
                  href={`https://facebook.com/${detail.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Facebook"
                  className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center transition-colors hover:bg-gray-100"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4">
                    <path
                      fill="#1877F2"
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                    />
                  </svg>
                </a>
              )}
              {detail.youtube && (
                <a
                  href={`https://youtube.com/@${detail.youtube}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="YouTube"
                  className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center transition-colors hover:bg-gray-100"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4">
                    <path
                      fill="#FF0000"
                      d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                    />
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
