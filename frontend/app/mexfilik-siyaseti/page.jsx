import InfoPageShell from "@/components/InfoPageShell";

const sideItems = [
  { href: "/mexfilik-siyaseti", label: "Mexfilik siyaseti" },
  { href: "/sertler-ve-qaydalar", label: "Sertler ve qaydalar" },
  { href: "/haqqimizda", label: "Haqqimizda" },
  { href: "/tez-tez-verilen-suallar", label: "Tez-tez verilen suallar" },
];

export const metadata = {
  title: "Mexfilik siyaseti",
  description: "Detalcenter.az istifadeci melumatlarinin toplanmasi, saxlanmasi ve istifadesi qaydalari.",
};

export default function PrivacyPolicyPage() {
  return (
    <InfoPageShell
      eyebrow="Mexfilik"
      title="Mexfilik siyaseti"
      intro="Bu sehife Detalcenter.az platformasinda topladigimiz melumatlarin ne ucun istifade olundugunu, nece qorundugunu ve istifadecinin hansi huquqlara sahib oldugunu aydin izah edir."
      sideItems={sideItems}
    >
      <section>
        <h2 className="text-xl font-bold text-slate-950">Hansi melumatlari toplayiriq</h2>
        <p className="mt-3">
          Qeydiyyat, sifaris, geri qaytarma ve destek soraglari zamani ad, soyad, telefon nomresi, email unvani, catdirilma unvani ve sifaris tarixi kimi melumatlar toplanir.
        </p>
        <p className="mt-3">
          Odenis melumatlari birbasa sayt serverinde saxlanilmir. Odenis prosesi ucuncu teref xidmetleri vasitesile icra edildikde, onlarin oz mexfilik qaydalari da tetbiq oluna biler.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-950">Melumatlardan ne ucun istifade olunur</h2>
        <p className="mt-3">
          Toplanan melumatlar sifarisi emal etmek, musteri ile elaqe saxlamaq, catdirilmani teskil etmek, geri qaytarma soraglarini arashdirmaq ve xidmet keyfiyyetini yaxsilasdirmaq ucun istifade olunur.
        </p>
        <p className="mt-3">
          Eyni zamanda texniki xetalarin aradan qaldirilmasi, saxtakarligin qarsisinin alinmasi ve hesab tehlukesizliyinin qorunmasi meqsedile sistem qeydlari saxlanila biler.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-950">Melumatlarin qorunmasi</h2>
        <p className="mt-3">
          Hesab, sifaris ve elaqe melumatlari yalniz xidmetin gosterilmesi ucun zeruri ischi prosese daxil olan sexsler ucun elcatan saxlanilir. Qeyri-qanuni elcatanliq riskini azaltmaq ucun texniki ve inzibati qoruma tedbirleri tetbiq olunur.
        </p>
        <p className="mt-3">
          Bununla bele, internet uzre melumat muabadilasi tam risksiz deyildir. Istifadeciler hesab parollarini mexfi saxlamali ve hesablarina aid qeyri-adi hereketleri bize bildirmelidirler.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-950">Ucuncu tereflerle paylasma</h2>
        <p className="mt-3">
          Melumatlar yalniz sifarisi icra etmek ucun zeruri oldugu hallarda catdirilma partnyorlari, odenis xidmeti provayderleri ve qanunvericiliyin teleb etdiyi diger hallarda aidiyyeti qurumlarla paylasila biler.
        </p>
        <p className="mt-3">
          Marketinq meqsedile sexsi melumatlar istifadecinin raziligi olmadan satilmir ve icazesiz ucuncu tereflerle bolusulmur.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-950">Istifadecinin huquqlari</h2>
        <p className="mt-3">
          Istifadeci oz hesab melumatlarini yenilemek, sehv ve ya kohne melumatlarin duzeltilmesini istemek, yaxud qanunvericiliyin icaze verdiyi hallarda melumatlarinin silinmesi ucun muraciet etmek huququna malikdir.
        </p>
        <p className="mt-3">
          Bu movzuda sualiniz varsa, `info@avtopro.az` unvanina yaza ve ya `+994 55 738 00 13` nomresi ile elaqe saxlaya bilersiniz.
        </p>
      </section>
    </InfoPageShell>
  );
}
