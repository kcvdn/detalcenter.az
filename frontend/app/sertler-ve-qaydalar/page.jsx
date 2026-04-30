import InfoPageShell from "@/components/InfoPageShell";

const sideItems = [
  { href: "/mexfilik-siyaseti", label: "Mexfilik siyaseti" },
  { href: "/sertler-ve-qaydalar", label: "Sertler ve qaydalar" },
  { href: "/haqqimizda", label: "Haqqimizda" },
  { href: "/tez-tez-verilen-suallar", label: "Tez-tez verilen suallar" },
];

export const metadata = {
  title: "Sertler ve qaydalar",
  description: "Detalcenter.az platformasindan istifadeni tenzimleyen esas sertler ve qaydalar.",
};

export default function TermsPage() {
  return (
    <InfoPageShell
      eyebrow="Qaydalar"
      title="Sertler ve qaydalar"
      intro="Bu sertler Detalcenter.az platformasindan istifade zamani alici, satici ve platforma arasindaki umumi qaydalari, mesuliyyet serhedlerini ve sifaris prosesinin esas prinsplerini muyyen edir."
      sideItems={sideItems}
    >
      <section>
        <h2 className="text-xl font-bold text-slate-950">Platformadan istifade</h2>
        <p className="mt-3">
          Saytdan istifade eden her bir sexs burada yerlesen qaydalari qebul etmis hesab olunur. Platforma avtomobil ehtiyat hisselerinin axtarisi, sifarisi ve saticilarla elaqe qurulmasi ucun nezerde tutulub.
        </p>
        <p className="mt-3">
          Istifadeci saxta hesab yaratmamaq, yanildici melumat vermemek ve sistemin isine qesden mane olmamaq ohdeliiyini dasiyir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-950">Mehsul melumatlari</h2>
        <p className="mt-3">
          Saytda gosterilen mehsul adi, sekli, qiymeti, OEM kodu ve uygunluq melumatlari mumkun qeder deqiq saxlanilir. Buna baxmayaraq, eyni mehsulun model, il ve komplektasiyaya gore ferqi ola biler.
        </p>
        <p className="mt-3">
          Sifarisi tesdiq etmeden once alici oz avtomobiline uygunlugu OEM kodu, VIN ve ya satici desteyi ile bir daha yoxlamalidir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-950">Sifaris ve odenis</h2>
        <p className="mt-3">
          Sifaris sistemde yaradildiqdan sonra emal merhelesine kecir. Qeyd olunan qiymet, stok ve catdirilma sertleri son tesdiq zamani yeniden deqiqlestirile biler.
        </p>
        <p className="mt-3">
          Odenis ve catdirilma prosesi sifarisin novune, mehsulun oldugu anbardan ve secilen xidmete gore ferqlene biler. Platforma ziddiyyet yaradan hallarda sifarisi el ile yoxlama huququnu saxlayir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-950">Geri qaytarma ve legv</h2>
        <p className="mt-3">
          Geri qaytarma muracietleri mehsulun veziyyeti, qutusunun tamligi, sifaris tarixi ve uygunluq yoxlamasi esasinda qiymetlendirilir. Qurasdirilmis, istifade olunmus ve ya zedelenmis mehsullar geri qaytarma ucun mehdudlasdirila biler.
        </p>
        <p className="mt-3">
          Sifarisi legv etmek istediyiniz halda destek xidmeti ile en qisa vaxtda elaqe saxlamaq meslehetdir. Catdirilmaya verildikden sonra legv sertleri ferqli ola biler.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-950">Mesuliyyetin serhedi</h2>
        <p className="mt-3">
          Platforma mehsul melumatlarini duzgun saxlamaq ucun calissa da, avtomobilin servis tarixcesi, qeyri-standart deyisiklikleri ve ya yalnis secim neticesinde yaranan butun ziyanlara gore birbasa cavabdehlik dasimir.
        </p>
        <p className="mt-3">
          Her hansi sual, etiraz ve ya muelliseli hal ucun bizimle elaqe saxlaya bilersiniz. Muracietler tarixce ile birlikde arashdirilir.
        </p>
      </section>
    </InfoPageShell>
  );
}
