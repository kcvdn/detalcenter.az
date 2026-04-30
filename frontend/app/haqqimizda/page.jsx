import Link from "next/link";
import InfoPageShell from "@/components/InfoPageShell";

const sideItems = [
  { href: "/mexfilik-siyaseti", label: "Mexfilik siyaseti" },
  { href: "/sertler-ve-qaydalar", label: "Sertler ve qaydalar" },
  { href: "/haqqimizda", label: "Haqqimizda" },
  { href: "/tez-tez-verilen-suallar", label: "Tez-tez verilen suallar" },
];

export const metadata = {
  title: "Haqqimizda",
  description: "Detalcenter.az-in meqsedi, xidmet yanasmasi ve musteriye verdiyi esas deyerler.",
};

export default function AboutPage() {
  return (
    <InfoPageShell
      eyebrow="Komanda"
      title="Haqqimizda"
      intro="Detalcenter.az avtomobil ehtiyat hisselerini daha rahat tapmaq, daha guvenli sifaris etmek ve daha cevik destek almaq isteyen istifadeciler ucun qurulan marketplace tipli platformadir."
      sideItems={sideItems}
    >
      <section>
        <h2 className="text-xl font-bold text-slate-950">Biz ne edirik</h2>
        <p className="mt-3">
          Platformada alicilar marka, model, kateqoriya, OEM kodu ve diger axtaris vasitelari ile lazim olan hisseni tapa, saticilar ise oz mehsullarini daha sistemli sekilde idare ede bilirler.
        </p>
        <p className="mt-3">
          Meqsedimiz avtomobil sahibi ile dogru ehtiyat hissesini satan magazani daha qisa vaxtda bir araya getirmekdir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-950">Neye gore ferqliyik</h2>
        <p className="mt-3">
          Sade katalog, cevik axtaris, dashboard idaresi ve sifaris izleme kimi funksiyalarla hem alici, hem de satici ucun prosesi sadelesdiririk. Vizual olaraq sade, amma is baximindan cevik platforma qurmaq bizim esas yanasmamizdir.
        </p>
        <p className="mt-3">
          Bizim ucun en vacib meqamlar deqiqlik, suret ve musteri ile aydin kommunikasiya qurmaqdir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-950">Xidmet prinsplerimiz</h2>
        <p className="mt-3">
          Her sifarisde aydin melumat, mumkun qeder duzgun uygunluq, vaxtinda geri donus ve praktiki destek vermeye ustunluk veririk.
        </p>
        <p className="mt-3">
          Platformanin inkisafi davam edir. Yeni kategoriyalar, satici imkanlari ve musteri rahatligini artiran funksiyalar merheleli sekilde elave olunur.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-950">Bizimle emekdasliq</h2>
        <p className="mt-3">
          Satici kimi platformaya qosulmaq, oz mehsullarini idare etmek ve daha genis auditoriyaya catmaq isteyirsense, bizimle elaqe saxlaya bilersen.
        </p>
        <p className="mt-3">
          Elave melumat ucun <Link href="/catalog" className="font-semibold text-red-500 hover:text-red-600">kataloqa bax</Link> ve ya destek komandamiza yaz.
        </p>
      </section>
    </InfoPageShell>
  );
}
