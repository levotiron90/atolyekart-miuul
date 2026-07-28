// AtölyeKart stok durumu. Tek amacı budur — ürün açıklaması/fiyat gibi katalog
// verisiyle karışmaz (bkz. src/data/card.js). Bir ürün tükendiğinde/geldiğinde
// sadece burada ilgili satırı true/false yapıp kaydedin; kod tarafında başka
// bir değişiklik gerekmez.
//
// Anahtar format: "<ürün-slug>_<varyant-slug>" (index.html'deki getProductId
// fonksiyonuyla aynı format — bkz. atolyekart-conventions skill).
const STOCK = {
  "soguk-proses-kalip-sabun_lavanta-pembe-kil": true,
  "soguk-proses-kalip-sabun_aktif-karbon-cay-agaci": false,
  "soguk-proses-kalip-sabun_yulaf-ham-bal": true,

  "kati-sampuan-bari_argan-keratin": true,
  "kati-sampuan-bari_biberiye-isirgan-otu": true,
  "kati-sampuan-bari_yesil-cay-narenciye": true,

  "aromaterapik-dus-tableti_okaliptus-nane": true,
  "aromaterapik-dus-tableti_lavanta-ylang-ylang": true,
  "aromaterapik-dus-tableti_tatli-portakal-bergamot": true,
};
