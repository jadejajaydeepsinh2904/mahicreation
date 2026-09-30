export type SampleProduct={id:string;name:string;name_gu:string;category:string;price:number;description:string;description_gu:string;image:string;in_stock:number;sample:true;sampleSheet:string;sampleIndex:number};
type Entry=[name:string,gu:string,price:number,description:string,descriptionGu:string];
type Group={category:string;sheet:string;items:Entry[]};

const groups:Group[]=[
  {category:'Sarees',sheet:'sarees',items:[
    ['Ivory Banarasi Saree','આઇવરી બનારસી સાડી',3950,'Ivory silk-look saree with a rich gold border for celebrations.','સોનેરી બોર્ડરવાળી આઇવરી સાડી. પ્રસંગો માટે સુંદર પસંદગી.'],
    ['Maroon Kanjivaram Saree','મરૂન કાંજીવરમ સાડી',4850,'Deep maroon drape with a broad traditional zari-style border.','પરંપરાગત પહોળી બોર્ડરવાળી ઘેરા મરૂન રંગની સાડી.'],
    ['Rose Chiffon Saree','ગુલાબી શિફોન સાડી',1890,'A soft rose-pink drape with delicate embroidered details.','નાજુક ભરતકામ સાથે ગુલાબી રંગની હળવી સાડી.'],
    ['Navy Bandhani Saree','નેવી બાંધણી સાડી',2450,'Navy blue with white Bandhani dots and a festive border.','સફેદ બાંધણી અને સુંદર બોર્ડરવાળી નેવી બ્લુ સાડી.'],
    ['Green Patola Saree','લીલી પટોળા સાડી',3650,'Emerald green with colorful geometric Patola-style motifs.','રંગીન ભાતવાળી લીલી પટોળા ડિઝાઇનની સાડી.'],
    ['Lavender Organza Saree','લેવેન્ડર ઓર્ગેન્ઝા સાડી',2790,'A light lavender drape with floral embroidery.','ફૂલોના ભરતકામવાળી હળવા જાંબલી રંગની સાડી.'],
    ['Mustard Georgette Saree','મસ્ટર્ડ જ્યોર્જેટ સાડી',1590,'Mustard yellow with subtle gold accents for a bright look.','નાજુક સોનેરી કામવાળી મસ્ટર્ડ પીળી સાડી.'],
    ['Black Sequin Saree','કાળી સીક્વિન સાડી',3290,'Black evening drape with subtle sparkling details.','ચમકદાર નાજુક કામવાળી કાળી પાર્ટી વેર સાડી.'],
    ['Red Cotton Silk Saree','લાલ કોટન સિલ્ક સાડી',2190,'Red saree with a cream woven-style traditional border.','ક્રીમ રંગની પરંપરાગત બોર્ડરવાળી લાલ સાડી.'],
    ['Peach Linen Saree','પીચ લિનન સાડી',1990,'Peach-colored textured drape with a simple elegant border.','સાદી સુંદર બોર્ડરવાળી પીચ રંગની સાડી.'],
  ]},
  {category:'Clothing',sheet:'clothing',items:[
    ['Rose Chikankari Kurta','ગુલાબી ચિકનકારી કુર્તા',1850,'Rose kurta with delicate embroidery. Sample sizes: S–XXL.','નાજુક ભરતકામવાળો ગુલાબી કુર્તા. સેમ્પલ સાઇઝ: S થી XXL.'],
    ['Blue Kurta Set','આસમાની કુર્તા સેટ',2290,'Powder-blue kurta with matching straight pants. Sample sizes: S–XXL.','મેચિંગ પેન્ટ સાથે આસમાની કુર્તા સેટ. સેમ્પલ સાઇઝ: S થી XXL.'],
    ['Maroon Anarkali Dress','મરૂન અનારકલી ડ્રેસ',3490,'A flowing maroon festive dress with gold-toned embroidery.','સોનેરી ભરતકામવાળો મરૂન રંગનો પ્રસંગ માટેનો અનારકલી ડ્રેસ.'],
    ['Navy Mens Kurta','પુરુષોનો નેવી કુર્તા',1190,'Classic navy kurta for men. Sample sizes: 36–44.','પુરુષો માટે નેવી બ્લુ કુર્તા. સેમ્પલ સાઇઝ: 36 થી 44.'],
    ['Kutchi Navratri Kurta','કચ્છી નવરાત્રી કુર્તા',1490,'Cream mens kurta with colorful Kutchi-style embroidery.','રંગીન કચ્છી કામવાળો ક્રીમ કુર્તા. નવરાત્રી માટે સુંદર પસંદગી.'],
    ['Blush Everyday Kurti','ગુલાબી રોજિંદી કુર્તી',890,'A blush-pink straight kurti with delicate embroidered details.','નાજુક ભરતકામવાળી હળવી ગુલાબી રોજિંદી કુર્તી.'],
    ['Printed Co-ord Set','પ્રિન્ટેડ કો-ઓર્ડ સેટ',1790,'Navy and ivory printed shirt with matching trousers.','નેવી અને આઇવરી પ્રિન્ટવાળા મેચિંગ શર્ટ અને પેન્ટનો સેટ.'],
    ['Emerald Festive Lehenga','લીલો ફેસ્ટિવ લહેંગા',4990,'An embroidered green lehenga with matching blouse and dupatta.','મેચિંગ બ્લાઉઝ અને દુપટ્ટા સાથે ભરતકામવાળો લીલો લહેંગા.'],
    ['Ivory Embroidered Blouse','આઇવરી ભરતકામનો બ્લાઉઝ',990,'An ivory festive blouse with floral embroidered details.','ફૂલોના ભરતકામવાળો આઇવરી રંગનો બ્લાઉઝ.'],
    ['Sage Palazzo Pants','સેજ ગ્રીન પલાઝો',790,'Relaxed wide-leg palazzo trousers in a soft sage shade.','હળવા લીલા રંગની આરામદાયક પહોળી પલાઝો પેન્ટ.'],
  ]},
  {category:'Jewellery',sheet:'jewellery',items:[
    ['Emerald Kundan Necklace','લીલો કુંદન નેકલેસ',2490,'Green stones, gold-tone details and pearl-style drops.','લીલા સ્ટોન અને મોતી જેવી લટકણવાળો કુંદન ડિઝાઇનનો નેકલેસ.'],
    ['Pearl Jhumka Earrings','મોતીના ઝુમખા',790,'A pair of gold-tone jhumkas with pearl-style details.','મોતી જેવી લટકણ સાથે સોનેરી રંગના ઝુમખાની જોડી.'],
    ['Classic Pearl Necklace','ક્લાસિક મોતીનો હાર',1290,'A layered ivory pearl-style necklace for an elegant finish.','સુંદર લુક માટે આઇવરી મોતી જેવી માળાવાળો હાર.'],
    ['Festive Bangle Set','ફેસ્ટિવ બંગડી સેટ',990,'An ornate gold-tone bangle set with traditional detailing.','પરંપરાગત ડિઝાઇનવાળો સોનેરી રંગની બંગડીઓનો સેટ.'],
    ['Rose Stone Pendant','ગુલાબી સ્ટોન પેન્ડન્ટ',690,'A rose-pink stone pendant with a delicate chain.','નાજુક ચેઇન સાથે ગુલાબી સ્ટોનનું પેન્ડન્ટ.'],
    ['Pearl Chandbali Earrings','મોતીની ચાંદબાલી',890,'Crescent-shaped earrings finished with pearl-style drops.','મોતી જેવી લટકણવાળી ચાંદ આકારની ઇયરિંગ્સની જોડી.'],
    ['Oxidized Statement Necklace','ઓક્સિડાઇઝ્ડ નેકલેસ',1190,'A silver-tone tribal necklace for Navratri and festive looks.','નવરાત્રીના લુક માટે સિલ્વર રંગનો ટ્રાઇબલ ડિઝાઇનનો નેકલેસ.'],
    ['Ruby Maang Tikka','લાલ સ્ટોનનો માંગટીકો',590,'A festive forehead ornament with red and gold-tone details.','લાલ સ્ટોન અને સોનેરી ડિઝાઇનવાળો પ્રસંગ માટેનો માંગટીકો.'],
    ['Silver-tone Anklet Pair','સિલ્વર રંગની પાયલ',790,'A pair of delicate anklets with small bell details.','નાની ઘૂઘરીઓવાળી નાજુક પાયલની જોડી.'],
    ['Green Floral Ring','લીલા સ્ટોનની વીંટી',490,'A gold-tone floral ring with an emerald-green center.','લીલા સ્ટોન સાથે ફૂલની ડિઝાઇનવાળી સોનેરી રંગની વીંટી.'],
  ]},
  {category:'Accessories',sheet:'accessories',items:[
    ['Floral Printed Stole','ફ્લોરલ પ્રિન્ટેડ સ્ટોલ',590,'A cream stole with a soft floral print and fringe detail.','ફૂલોની પ્રિન્ટ અને કિનારીવાળો ક્રીમ રંગનો સ્ટોલ.'],
    ['Rose Satin Scarf','ગુલાબી સાટિન સ્કાર્ફ',390,'A rose-pink satin-look scarf for everyday styling.','રોજિંદી સ્ટાઇલ માટે ગુલાબી રંગનો સાટિન લુક સ્કાર્ફ.'],
    ['Embellished Hair Clip','સજાવટવાળી હેર ક્લિપ',249,'A gold-tone hair clip with white stone-style details.','સફેદ સ્ટોન જેવી સજાવટ સાથે સોનેરી રંગની હેર ક્લિપ.'],
    ['Golden Waist Belt','સોનેરી વેસ્ટ બેલ્ટ',490,'A woven gold-tone belt to style a saree or dress.','સાડી કે ડ્રેસ સાથે પહેરવા માટે સોનેરી રંગનો બેલ્ટ.'],
    ['Round Sunglasses','ગોળ સનગ્લાસિસ',690,'Round tortoiseshell-style sunglasses with a classic shape.','ક્લાસિક ગોળ આકારની બ્રાઉન ફ્રેમવાળા સનગ્લાસિસ.'],
    ['Pearl Hairband','મોતીવાળો હેરબેન્ડ',349,'An ivory hairband decorated with pearl-style accents.','મોતી જેવી સજાવટવાળો આઇવરી હેરબેન્ડ.'],
    ['Satin Scrunchies Set','સાટિન સ્ક્રન્ચીઝ સેટ',199,'Three turquoise satin-look scrunchies in one set.','ટર્કોઇઝ રંગની ત્રણ સાટિન લુક સ્ક્રન્ચીઝનો સેટ.'],
    ['Tan Strap Watch','ટેન પટ્ટાવાળી ઘડિયાળ',1190,'A minimal analog watch with a tan strap and simple dial.','ટેન રંગના પટ્ટા અને સાદા ડાયલવાળી હાથઘડિયાળ.'],
    ['Floral Brooch','ફ્લોરલ બ્રોચ',290,'A decorative embroidered floral pin for scarves and outfits.','સ્કાર્ફ કે કપડાં પર લગાવવા માટે ફૂલની ડિઝાઇનવાળો બ્રોચ.'],
    ['Navy Paisley Bandana','નેવી પ્રિન્ટેડ બંદાના',249,'A navy bandana with an ivory paisley-style print.','આઇવરી પ્રિન્ટવાળો નેવી બ્લુ રંગનો બંદાના.'],
  ]},
  {category:'Bags',sheet:'bags',items:[
    ['Tan Classic Handbag','ટેન ક્લાસિક હેન્ડબેગ',1890,'A structured tan handbag with top handle and clasp detail.','હેન્ડલ અને ક્લાસ્પવાળી ટેન રંગની ક્લાસિક હેન્ડબેગ.'],
    ['Maroon Velvet Potli','મરૂન વેલ્વેટ પોટલી',790,'A maroon drawstring potli with festive embroidery.','પ્રસંગ માટે ભરતકામવાળી મરૂન રંગની પોટલી બેગ.'],
    ['Black Evening Clutch','કાળો ઇવનિંગ ક્લચ',990,'A black envelope-style clutch with a delicate embellished strip.','નાજુક સજાવટવાળો કાળા રંગનો પાર્ટી ક્લચ.'],
    ['Everyday Canvas Tote','રોજિંદી કેનવાસ ટોટ બેગ',1190,'A roomy cream tote with tan handles for everyday essentials.','રોજિંદી વસ્તુઓ માટે ટેન હેન્ડલવાળી ક્રીમ ટોટ બેગ.'],
    ['Brown Crossbody Sling','બ્રાઉન સ્લિંગ બેગ',1390,'A compact brown crossbody bag with an adjustable-style strap.','લાંબા પટ્ટાવાળી કોમ્પેક્ટ બ્રાઉન સ્લિંગ બેગ.'],
    ['Golden Box Clutch','સોનેરી બોક્સ ક્લચ',1590,'A textured gold-tone box clutch for festive outfits.','પ્રસંગના કપડાં સાથે સોનેરી રંગનો બોક્સ ક્લચ.'],
    ['Blush Mini Shoulder Bag','ગુલાબી મિની શોલ્ડર બેગ',990,'A blush-pink compact shoulder bag with a curved shape.','વળાંકવાળી ડિઝાઇનની નાની ગુલાબી શોલ્ડર બેગ.'],
    ['Black Everyday Backpack','કાળો રોજિંદો બેકપેક',1690,'A small black backpack with a front zip pocket.','આગળ ઝિપ પોકેટવાળો નાનો કાળો બેકપેક.'],
    ['Floral Zip Pouch','ફ્લોરલ ઝિપ પાઉચ',390,'A floral printed pouch for small everyday essentials.','રોજિંદી નાની વસ્તુઓ માટે ફૂલોની પ્રિન્ટવાળો ઝિપ પાઉચ.'],
    ['Navy Compact Wallet','નેવી કોમ્પેક્ટ વોલેટ',590,'A compact navy zip wallet for cards and cash.','કાર્ડ અને રોકડ માટે નાનું નેવી બ્લુ ઝિપ વોલેટ.'],
  ]},
  {category:'Other',sheet:'other',items:[
    ['Embroidered Mojari','ભરતકામવાળી મોજડી',990,'Tan embroidered juttis to complete a festive look. Sample sizes: 36–41.','પ્રસંગના લુક માટે ટેન રંગની ભરતકામવાળી મોજડી. સેમ્પલ સાઇઝ: 36 થી 41.'],
    ['Blush Flat Sandals','ગુલાબી ફ્લેટ સેન્ડલ',690,'Blush-pink slip-on sandals with decorative detailing.','સુંદર સજાવટવાળા ગુલાબી ફ્લેટ સ્લિપ-ઓન સેન્ડલ.'],
    ['Embroidered Cushion Cover','ભરતકામવાળું કુશન કવર',590,'A cream cushion-cover design with gold embroidered florals.','સોનેરી ફૂલોના ભરતકામવાળું ક્રીમ રંગનું કુશન કવર.'],
    ['Travel Vanity Case','ટ્રાવેલ વેનિટી કેસ',890,'A blush travel case to organize cosmetics and small essentials.','કોસ્મેટિક્સ ગોઠવવા માટે ગુલાબી ટ્રાવેલ વેનિટી કેસ.'],
    ['Wooden Jewellery Box','લાકડાનું જ્વેલરી બોક્સ',1290,'A wooden storage box with separate jewellery compartments.','જ્વેલરી ગોઠવવા અલગ ખાનાંવાળું લાકડાનું બોક્સ.'],
    ['Amber Perfume Bottle','એમ્બર પરફ્યુમ બોટલ',790,'An elegant amber perfume bottle shown as a gift sample.','ગિફ્ટ સેમ્પલ તરીકે સુંદર એમ્બર રંગની પરફ્યુમ બોટલ.'],
    ['Festive Diya Pair','તહેવારના દીવાની જોડી',290,'Two decorative terracotta diyas for festive decor.','તહેવારની સજાવટ માટે માટીના બે સુંદર દીવા.'],
    ['Ivory Glass Candle','આઇવરી ગ્લાસ કેન્ડલ',490,'An ivory candle in a clear glass jar for a cozy corner.','ઘરની સજાવટ માટે પારદર્શક ગ્લાસમાં આઇવરી મીણબત્તી.'],
    ['Cream Gift Box','ક્રીમ ગિફ્ટ બોક્સ',390,'A cream gift box with a gold satin-style ribbon.','સોનેરી રિબન સાથે ક્રીમ રંગનું ગિફ્ટ બોક્સ.'],
    ['Golden Hand Mirror','સોનેરી હેન્ડ મિરર',690,'A small oval mirror with an ornate gold-tone handle.','સોનેરી ડિઝાઇનવાળા હેન્ડલ સાથે નાનો અંડાકાર અરીસો.'],
  ]},
];

// Interleave the groups so the All view opens with every category represented.
export const samples:SampleProduct[]=Array.from({length:10},(_,index)=>groups.map(group=>{
  const [name,name_gu,price,description,description_gu]=group.items[index];
  return {id:`sample-${group.sheet}-${index+1}`,name,name_gu,category:group.category,price,description:`${description} Sample product and price for website demonstration only.`,description_gu:`${description_gu} આ પ્રોડક્ટ અને ભાવ ફક્ત વેબસાઇટના સેમ્પલ માટે છે.`,image:'',in_stock:1,sample:true as const,sampleSheet:group.sheet,sampleIndex:index};
})).flat();

// One viewBox per photo within each generated category atlas.
export function sampleViewBox(sheet:string,index:number){
  const cuts=sheet==='jewellery'?[0,225,408,592,798,1000]:[0,200,400,600,800,1000];
  const col=index%5,row=Math.floor(index/5);
  return `${cuts[col]} ${row*250} ${cuts[col+1]-cuts[col]} 250`;
}
