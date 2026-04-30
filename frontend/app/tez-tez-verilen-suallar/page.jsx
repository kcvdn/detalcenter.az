import InfoPageShell from "@/components/InfoPageShell";

const sideItems = [
  { href: "/mexfilik-siyaseti", label: "Mexfilik siyaseti" },
  { href: "/sertler-ve-qaydalar", label: "Sertler ve qaydalar" },
  { href: "/haqqimizda", label: "Haqqimizda" },
  { href: "/tez-tez-verilen-suallar", label: "Tez-tez verilen suallar" },
];

export const metadata = {
  title: "Tez-tez verilen suallar",
  description: "Sifaris, catdirilma, uygunluq ve geri qaytarma ile bagli en cox verilen suallar.",
};

const faqItems = [
  {
    question: "Mehsulun avtomobilime uygun oldugunu nece yoxlaya bilerem?",
    answer:
      "Marka, model, il, OEM kodu ve mumkundurse VIN melumatindan istifade et. Emin olmadigin halda sifarisi tesdiq etmeden once destek xidmeti ile elaqe saxla.",
  },
  {
    question: "Catdirilma nece heyata kecirilir?",
    answer:
      "Catdirilma sifarisin oldugu sehere, anbardaki stok veziyyetine ve secilen xidmete gore planlanir. Emal zamani musteriye elave deqiqlestirme verile biler.",
  },
  {
    question: "Sifarisden sonra mehsulu deyismek olar?",
    answer:
      "Sifaris emala verilmeyibse, deyisiklik cox vaxt mumkundur. Mehsul catdirilmaya hazirlanibsa, deyisiklik sertleri ferqli ola biler.",
  },
  {
    question: "Geri qaytarma hansi hallarda qebul olunur?",
    answer:
      "Qurasdirilmamis, istifade olunmamis ve tam komplekt olan mehsullar geri qaytarma ucun daha uygundur. Qaytarma soraglari mehsul novune gore ayrica qiymetlendirilir.",
  },
  {
    question: "Satici olmaq ucun ne etmek lazimdir?",
    answer:
      "Satici olaraq qosulmaq isteyirsense, platforma komandasi ile elaqe yarat. Magaza melumatlari ve mehsul idaresi imkani yoxlanildiqdan sonra seller paneline giris acila biler.",
  },
];

export default function FaqPage() {
  return (
    <InfoPageShell
      eyebrow="FAQ"
      title="Tez-tez verilen suallar"
      intro="Burada istifadecilerin en cox verdiyi suallari topladiq. Sifaris, catdirilma, uygunluq ve geri qaytarma ile bagli qisa cavablari bu sehifede tapa bilersen."
      sideItems={sideItems}
      sideTitle="Diger melumatlar"
    >
      <section>
        <h2 className="text-xl font-bold text-slate-950">En cox sorusulan movzular</h2>
        <div className="mt-4 space-y-4">
          {faqItems.map((item) => (
            <div
              key={item.question}
              className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4"
            >
              <h3 className="text-base font-bold text-slate-950">{item.question}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-950">Tapmadigin sual varsa</h2>
        <p className="mt-3">
          Bize telefon ve ya email ile yaz. Sualin sifaris nomresi, mehsul kodu ve ya avtomobil modeli ile baglidirsa, bu melumatlari elave etmeyin daha cevik cavab almaga komek eder.
        </p>
      </section>
    </InfoPageShell>
  );
}
