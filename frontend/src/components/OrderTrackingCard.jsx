import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";

export default function OrderTrackingCard() {
  const { i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const data = useMemo(
    () => ({
      statusLabel: "في انتظار الشحن",
      trackingId: "SHR123456789",
      shippingCompany: "DHL",
      duration: "خلال 5 - 7 أيام عمل",
      steps: [
        { title: "رفع استلام الطلب", desc: "تم استلام الطلب بنجاح", date: "17 سبتمبر 2022 10:00 م", done: true },
        { title: "تأكيد الدفع", desc: "تم تأكيد عملية الدفع", date: "17 سبتمبر 2022 10:00 م", done: true },
        { title: "رفع تجهيز الطلب", desc: "جاري تجهيز الطلب", date: "18 سبتمبر 2022 10:00 م", done: true },
        { title: "طلب شركة الشحن", desc: "تم طلب شركة الشحن", date: "19 سبتمبر 2022 10:00 م", done: true },
        { title: "جاهز لاستلام الشحن", desc: "الطلب جاهز للاستلام", date: "19 سبتمبر 2022 10:00 م", done: false },
      ],
    }),
    []
  );

  return (
    <div dir={currentDir} className="min-h-screen bg-white flex items-start justify-center p-4 sm:p-8 mt-40">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-5">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="rounded-md bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
              {data.statusLabel}
            </span>
          </div>

          <div className="text-sm font-bold text-slate-900">تتبع الطلب</div>

          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200"
            aria-label="refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-500">رقم التتبع</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{data.trackingId}</div>

              <div className="mt-3 text-xs text-slate-500">مدة الشحن</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{data.duration}</div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <div className="h-7 w-14 rounded bg-white ring-1 ring-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                {data.shippingCompany}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {data.steps.map((s, idx) => {
              const active = s.done;
              return (
                <div key={idx}  className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`h-3.5 w-3.5 rounded-full ${
                        active ? "bg-amber-500" : "bg-slate-300"
                      }`}
                    />
                    {idx !== data.steps.length - 1 && (
                      <span className="mt-1 h-8 w-px bg-slate-200" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">{s.title}</div>
                      <div className="text-[11px] text-slate-500 whitespace-nowrap">{s.date}</div>
                    </div>
                    <div className="mt-1 text-xs text-slate-600">{s.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
