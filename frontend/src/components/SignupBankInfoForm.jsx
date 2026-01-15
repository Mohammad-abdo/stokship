import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../routes";

const Field = ({ label, required, value, onChange, placeholder = "...", currentDir = 'rtl' }) => {
  return (
    <div className="w-full">
      <label className={`block text-sm font-semibold text-slate-800 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
        {label}
        {required && <span className="text-red-500 ms-1">*</span>}
      </label>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-2 w-full rounded-md border border-blue-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
      />
    </div>
  );
};

export default function SignupBankInfoForm() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    city: "",
    country: "",

    bankAccountName: "",
    bankAccountNumber: "",
    bankName: "",
    bankAddress: "",
    bankCode: "",
    swift: "",
    region: "",
    companyAddress: "",

    agree: true,
  });

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const setCheck = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.checked }));

  const onSubmit = (e) => {
    e.preventDefault();
    // Navigate to Seller page after form submission
    navigate(ROUTES.SELLER);
  };

  return (
    <div dir={currentDir} className="min-h-screen bg-white pt-20 sm:pt-32 md:pt-40 pb-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8 py-10">
        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-slate-100 bg-white shadow-sm p-6 sm:p-8 space-y-10"
        >
          {/* Section 1 */}
          <div>
            <div className="text-center text-lg font-bold text-slate-900">
              {t("signupBankInfo.title")}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                label={t("signupBankInfo.fullName")}
                required
                value={form.fullName}
                onChange={set("fullName")}
                placeholder={t("signupBankInfo.fullNamePlaceholder")}
                currentDir={currentDir}
              />
              <Field
                label={t("signupBankInfo.phone")}
                required
                value={form.phone}
                onChange={set("phone")}
                placeholder={t("signupBankInfo.phonePlaceholder")}
                currentDir={currentDir}
              />
            </div>

            <div className="mt-6">
              <Field
                label={t("signupBankInfo.email")}
                required
                value={form.email}
                onChange={set("email")}
                placeholder={t("signupBankInfo.emailPlaceholder")}
                currentDir={currentDir}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                label={t("signupBankInfo.city")}
                required
                value={form.city}
                onChange={set("city")}
                placeholder={t("signupBankInfo.cityPlaceholder")}
                currentDir={currentDir}
              />
              <Field
                label={t("signupBankInfo.country")}
                required
                value={form.country}
                onChange={set("country")}
                placeholder={t("signupBankInfo.countryPlaceholder")}
                currentDir={currentDir}
              />
            </div>
          </div>

          {/* Section 2 */}
          <div>
            <div className="text-center text-lg font-bold text-slate-900">
              {t("signupBankInfo.subtitle")}
            </div>

            <div className="mt-8 space-y-6">
              <Field
                label={t("signupBankInfo.bankAccountName")}
                required
                value={form.bankAccountName}
                onChange={set("bankAccountName")}
                placeholder={t("signupBankInfo.bankAccountNamePlaceholder")}
                currentDir={currentDir}
              />

              <Field
                label={t("signupBankInfo.bankAccountNumber")}
                required
                value={form.bankAccountNumber}
                onChange={set("bankAccountNumber")}
                placeholder={t("signupBankInfo.bankAccountNumberPlaceholder")}
                currentDir={currentDir}
              />

              <Field
                label={t("signupBankInfo.bankName")}
                required
                value={form.bankName}
                onChange={set("bankName")}
                placeholder={t("signupBankInfo.bankNamePlaceholder")}
                currentDir={currentDir}
              />

              <Field
                label={t("signupBankInfo.bankAddress")}
                required
                value={form.bankAddress}
                onChange={set("bankAddress")}
                placeholder={t("signupBankInfo.bankAddressPlaceholder")}
                currentDir={currentDir}
              />

              <Field
                label={t("signupBankInfo.bankCode")}
                required
                value={form.bankCode}
                onChange={set("bankCode")}
                placeholder={t("signupBankInfo.bankCodePlaceholder")}
                currentDir={currentDir}
              />

              <Field
                label={t("signupBankInfo.swift")}
                required
                value={form.swift}
                onChange={set("swift")}
                placeholder={t("signupBankInfo.swiftPlaceholder")}
                currentDir={currentDir}
              />

              <Field
                label={t("signupBankInfo.region")}
                required
                value={form.region}
                onChange={set("region")}
                placeholder={t("signupBankInfo.regionPlaceholder")}
                currentDir={currentDir}
              />

              <Field
                label={t("signupBankInfo.companyAddress")}
                required
                value={form.companyAddress}
                onChange={set("companyAddress")}
                placeholder={t("signupBankInfo.companyAddressPlaceholder")}
                currentDir={currentDir}
              />
            </div>

            <label className={`mt-8 flex items-center gap-3 rounded-md bg-rose-100/70 px-4 py-3 text-sm font-semibold text-slate-800 ${currentDir === 'rtl' ? 'flex-row-reverse justify-between' : 'justify-between'}`}>
              <span>{t("signupBankInfo.agreeTerms")}</span>
              <input
                type="checkbox"
                checked={form.agree}
                onChange={setCheck("agree")}
                className="h-4 w-4 rounded border-slate-300"
              />
            </label>

            <div className={`mt-6 flex flex-col sm:flex-row gap-4 ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
              <button
                type="submit"
                className="w-full sm:w-52 rounded-md bg-amber-500 px-6 py-3 text-sm font-bold text-blue-900 hover:bg-amber-600 transition-colors"
              >
                {t("signupBankInfo.done")}
              </button>
             
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
