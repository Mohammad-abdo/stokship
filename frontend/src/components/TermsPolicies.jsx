import React from 'react'
import { useTranslation } from "react-i18next";

export default function TermsPolicies() {
  const { i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  
  const termsText = `
لوريم إيبسوم دولار سيت أميت، كونسيكتيتور أديبيسينج إليت. سِد دو إيوسمد
تمبور إنكيديدنت يو لابوري إت دولوري ماجنا أليكا. يوت إنيم أد مينيم
فينيام، كيوس نوسترود إكسرسيتاشن أولامكو لابوريس نيسي أوت أليكيب إكس
إيا كومودو كونسيكوات. ديويس أيوتي إيروري دولور إن ريبريهينديريت إن
فولوبتاتي فيليت إسي سيليوم دولوري إيو فيوجيات نولا باريتور.
`;

  return (
    <div dir={currentDir} className=" bg-white my-25">
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-24 pt-30">
       

        {/* Content box */}
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-5 sm:p-6">
             {/* Title */}
        <div className="flex justify-start">
          <h1 className="text-xl font-bold text-blue-900">الشروط و الاحكام</h1>
        </div>
          <p className="text-lg leading-8 text-slate-700 whitespace-pre-line">
            {termsText}
          </p>
        </div>
      </div>
    </div>
  );
}
