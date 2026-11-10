// Product data
const trProducts = [
  { title: "Stanley Termos", price: "2990.00 TL", image: "/assets/images/stanley.png", link: "product-stanley.html" },
  { title: "Teleskopla Dolunay Gözlemi Bileti", price: "400.00 TL", image: "/assets/images/albaspaceshop_eb477f8cc10d14b917f64623a461cf38.png", link: "product-teleskopla-dolunay.html" },
  { title: "T-Shirt", price: "800.00 TL", image: "/assets/images/shirt1.png", link: "product-shirt1.html" },
  { title: "Alba Space Tişört", price: "800.00 TL", image: "/assets/images/shirt.png", link: "product-shirt.html" },
  { title: "Hoodie", price: "980.00 TL", image: "/assets/images/hoodie1.png", link: "product-hoodie1.html" },
  { title: "Alba Space Pullover Hoodie", price: "980.00 TL", image: "/assets/images/hoodie.png", link: "product-hoodie.html" },
  { title: "Katlaç/Sonsuz Küp", price: "120.00 TL", image: "/assets/images/hat.png", link: "product-hat.html" },
  { title: "Kitap PDF", price: "200.00 TL", image: "/assets/images/albamenvelara1.png", link: "product-albamenvelara1.html" },
  { title: "Kitap", price: "1000.00 TL", image: "/assets/images/albamenvelara.jpg", link: "product-albamenvelara.html" },
  { title: "AR 3D models", price: "50.00 TL", image: "/assets/images/Gemini_Generated_Image_yk5xbwyk5xbwyk5x.png", link: "/product-ar3dmodels.html" }
];

const enProducts = [
  { title: "Stanley Thermos", price: "2990.00 TL", image: "/assets/images/stanley.png", link: "/eng/product-stanley.html" },
  { title: "Telescope Full Moon Ticket", price: "400.00 TL", image: "/assets/images/albaspaceshop_eb477f8cc10d14b917f64623a461cf38.png", link: "/eng/product-teleskopla-dolunay.html" },
  { title: "T-Shirt", price: "800.00 TL", image: "/assets/images/shirt1.png", link: "/eng/product-shirt1.html" },
  { title: "Alba Space Tişört", price: "800.00 TL", image: "/assets/images/shirt.png", link: "/eng/product-shirt.html" },
  { title: "Hoodie", price: "980.00 TL", image: "/assets/images/hoodie1.png", link: "/eng/product-hoodie1.html" },
  { title: "Alba Space Pullover Hoodie", price: "980.00 TL", image: "/assets/images/hoodie.png", link: "/eng/product-hoodie.html" },
  { title: "Katlaç/Sonsuz Küp", price: "120.00 TL", image: "/assets/images/hat.png", link: "/eng/product-hat.html" },
  { title: "Book PDF", price: "200.00 TL", image: "/assets/images/albamenvelara1.png", link: "/eng/product-albamenvelara1.html" },
  { title: "Book", price: "1000.00 TL", image: "/assets/images/albamenvelara.jpg", link: "/eng/product-albamenvelara.html" },
  { title: "AR 3D models", price: "50.00 TL", image: "/assets/images/Gemini_Generated_Image_yk5xbwyk5xbwyk5x.png", link: "/eng/product-ar3dmodels.html" }
];

const ruProducts = [
  { title: "Термос Stanley", price: "2990.00 TL", image: "/assets/images/stanley.png", link: "/rus/product-stanley.html" },
  { title: "Билет на наблюдение полнолуния", price: "400.00 TL", image: "/assets/images/albaspaceshop_eb477f8cc10d14b917f64623a461cf38.png", link: "/rus/product-teleskopla-dolunay.html" },
  { title: "Футболка", price: "800.00 TL", image: "/assets/images/shirt1.png", link: "/rus/product-shirt1.html" },
  { title: "Футболка Alba Space", price: "800.00 TL", image: "/assets/images/shirt.png", link: "/rus/product-shirt.html" },
  { title: "Худи", price: "980.00 TL", image: "/assets/images/hoodie1.png", link: "/rus/product-hoodie1.html" },
  { title: "Худи Alba Space", price: "980.00 TL", image: "/assets/images/hoodie.png", link: "/rus/product-hoodie.html" },
  { title: "Бесконечный куб", price: "120.00 TL", image: "/assets/images/hat.png", link: "/rus/product-hat.html" },
  { title: "Книга PDF", price: "200.00 TL", image: "/assets/images/albamenvelara1.png", link: "/rus/product-albamenvelara1.html" },
  { title: "Книга", price: "1000.00 TL", image: "/assets/images/albamenvelara.jpg", link: "/rus/product-albamenvelara.html" },
  { title: "AR 3D-модели", price: "50.00 TL", image: "/assets/images/Gemini_Generated_Image_yk5xbwyk5xbwyk5x.png", link: "/rus/product-ar3dmodels.html" }
];

const arProducts = [
  { title: "كتاب", price: "1000.00 TL", image: "/assets/images/albamenvelara.jpg", link: "/ar/product-albamenvelara.html" },
  { title: "كتاب PDF", price: "200.00 TL", image: "/assets/images/albamenvelara1.png", link: "/ar/product-albamenvelara1.html" },
  { title: "نماذج AR ثلاثية الأبعاد", price: "50.00 TL", image: "/assets/images/Gemini_Generated_Image_yk5xbwyk5xbwyk5x.png", link: "/ar/product-ar3dmodels.html" }
];

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('related-products-container');
    if (!container) return;

    const lang = document.documentElement.lang || 'tr';
    let products = trProducts;
    if (lang === 'en') {
        products = enProducts;
    } else if (lang === 'ru') {
        products = ruProducts;
    } else if (lang === 'ar') {
        products = arProducts;
    }
    
    const currentPath = window.location.pathname;

    const allowedProduct = /product-(albamenvelara|albamenvelara1|ar3dmodels)\.html$/i;
    const currentFile = currentPath.split('/').pop();
    const availableProducts = products.filter(p => allowedProduct.test(p.link) && p.link.split('/').pop() !== currentFile);

    const shuffled = availableProducts.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    let html = '';
    selected.forEach(p => {
        html += `
        <a href="${p.link}">
          <div class="rel-img-wrap">
            <img src="${p.image}" alt="${p.title}" loading="lazy">
          </div>
          <div class="rel-info">
            <h3>${p.title}</h3>
            <p>${p.price}</p>
          </div>
        </a>
        `;
    });

    container.innerHTML = html;
});