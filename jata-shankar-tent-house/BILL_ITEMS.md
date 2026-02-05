# Bill Items Reference

Based on the Jata Shankar Tent House bill, here are all the items to add to Firestore.

## How to Add Items to Firestore

1. Go to Firebase Console → Firestore Database
2. Create collection named `items`
3. Add each item as a document with fields: `name` and `rate`

## Items List

Add these items to the `items` collection:

| # | Item Name (Hindi) | Item Name (English) | Suggested Rate |
|---|---|---|---|
| 1 | अरी शीशम 15 x 15 | Shisham Tent 15x15 | 500 |
| 2 | शीशम V.I.P | Shisham VIP | 600 |
| 3 | शीशम V.I.P 15x15 | Shisham VIP 15x15 | 650 |
| 4 | शीशम शीशम 15 x 15 | Shisham Shisham 15x15 | 550 |
| 5 | प्रेस प्लेन | Press Plain | 400 |
| 6 | रस्सी | Rope | 50 |
| 7 | गद्दा | Mattress | 100 |
| 8 | बड़ा कोट पालिन | Large Coat Paulin | 300 |
| 9 | रंग लकड़ी | Colored Wood | 150 |
| 10 | रंग लकड़ी | Colored Wood | 150 |
| 11 | कालीन क्रीम मार्की | Carpet Cream Marquee | 200 |
| 12 | पोलिन पर्दा (सीटी) | Paulin Curtain (Seat) | 100 |
| 13 | बेंच विशाल | Bench Large | 80 |
| 14 | लामिनेट प्लाई 1 सेट | Laminate Ply 1 Set | 120 |
| 15 | जमीनाया रस्सी प्ला फुल | Ground Rope Pla Full | 90 |
| 16 | कुर्सी कालीन | Chair Carpet | 60 |
| 17 | नाइट पर कालीन वाला | Night Per Carpet | 70 |
| 18 | रंज उपकरण हार्ड मोडिफाई | Ranj Equipment Hard Modify | 200 |
| 19 | रंज उपकरण हार्ड प्लेट | Ranj Equipment Hard Plate | 180 |
| 20 | कबाड़ी बेड | Kabadi Bed | 150 |
| 21 | कबाड़ी चेयर | Kabadi Chair | 80 |
| 22 | बर्तन | Utensils | 100 |
| 23 | तला | Tala | 50 |
| 24 | पलंग | Bed | 120 |
| 25 | कुर्सी | Chair | 60 |
| 26 | बैठ पर्दा कालीन कर्पी | Seat Curtain Carpet Carpi | 90 |
| 27 | बैठ पर्दा विशाल | Seat Curtain Large | 110 |
| 28 | पलंग हीटर कालीन की | Bed Heater Carpet | 140 |
| 29 | पलंग हीटर कालीन की | Bed Heater Carpet | 140 |
| 30 | खाट ई | Khat E | 70 |
| 31 | खाट ई | Khat E | 70 |
| 32 | खाट बेड़ी | Khat Bedi | 85 |
| 33 | शिलान्यास स्टेज डेकोर के | Shilanyaas Stage Decor | 300 |
| 34 | कालीन स्टेज की | Carpet Stage | 250 |
| 35 | तकिया स्टेज के | Pillow Stage | 40 |
| 36 | कोठा | Kotha | 100 |
| 37 | बी.ओ. | B.O. | 80 |
| 38 | टेबल | Table | 90 |
| 39 | टेबल कवर कुर्सी | Table Cover Chair | 110 |
| 40 | प्लेट | Plate | 5 |
| 41 | सजावट प्लेट | Decoration Plate | 8 |
| 42 | कालीन ब्रोड | Carpet Broad | 120 |
| 43 | कालीन ब्रोड | Carpet Broad | 120 |
| 44 | छोटी बनाएं | Small Make | 60 |
| 45 | उपकरण + 3 सीएफएल की | Equipment + 3 CFL | 150 |
| 46 | 10 सीएफएल छोटे | 10 CFL Small | 80 |
| 47 | झूलर | Jhular | 200 |
| 48 | झूलर घाटे | Jhular Ghate | 180 |
| 49 | कारा सेट मुखौटा | Kara Set Mukhauta | 250 |
| 50 | कारा सेट मुखौटा | Kara Set Mukhauta | 250 |
| 51 | कारा सेट घुमा | Kara Set Ghuma | 220 |
| 52 | साइड ड्रेस | Side Dress | 150 |

## Firestore Document Format

Each item should be added as a document with this structure:

```javascript
{
  name: "अरी शीशम 15 x 15",
  rate: 500
}
```

## Adding Items via Firebase Console

1. Go to https://console.firebase.google.com
2. Select your project
3. Go to Firestore Database
4. Click on `items` collection
5. Click "Add document"
6. Enter document ID (auto-generated is fine)
7. Add fields:
   - Field: `name` | Type: `string` | Value: `अरी शीशम 15 x 15`
   - Field: `rate` | Type: `number` | Value: `500`
8. Click "Save"
9. Repeat for all items

## Adding Items via Code

You can also add items programmatically:

```javascript
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase/firebaseConfig';

const items = [
  { name: "अरी शीशम 15 x 15", rate: 500 },
  { name: "शीशम V.I.P", rate: 600 },
  { name: "शीशम V.I.P 15x15", rate: 650 },
  // ... add all items
];

async function addItems() {
  const itemsRef = collection(db, 'items');
  
  for (const item of items) {
    await addDoc(itemsRef, item);
  }
  
  console.log('All items added');
}

// Call this function once to populate items
addItems();
```

## Notes

- Rates are suggestions - adjust based on your business
- Item names are in Hindi as per the original bill
- You can add English translations in the app if needed
- Update rates anytime from the Items management page
- All items will be available for bill creation

## Quick Copy-Paste for Firebase Console

If adding manually, here's the data in a simple format:

```
अरी शीशम 15 x 15 - 500
शीशम V.I.P - 600
शीशम V.I.P 15x15 - 650
शीशम शीशम 15 x 15 - 550
प्रेस प्लेन - 400
रस्सी - 50
गद्दा - 100
बड़ा कोट पालिन - 300
रंग लकड़ी - 150
रंग लकड़ी - 150
कालीन क्रीम मार्की - 200
पोलिन पर्दा (सीटी) - 100
बेंच विशाल - 80
लामिनेट प्लाई 1 सेट - 120
जमीनाया रस्सी प्ला फुल - 90
कुर्सी कालीन - 60
नाइट पर कालीन वाला - 70
रंज उपकरण हार्ड मोडिफाई - 200
रंज उपकरण हार्ड प्लेट - 180
कबाड़ी बेड - 150
कबाड़ी चेयर - 80
बर्तन - 100
तला - 50
पलंग - 120
कुर्सी - 60
बैठ पर्दा कालीन कर्पी - 90
बैठ पर्दा विशाल - 110
पलंग हीटर कालीन की - 140
पलंग हीटर कालीन की - 140
खाट ई - 70
खाट ई - 70
खाट बेड़ी - 85
शिलान्यास स्टेज डेकोर के - 300
कालीन स्टेज की - 250
तकिया स्टेज के - 40
कोठा - 100
बी.ओ. - 80
टेबल - 90
टेबल कवर कुर्सी - 110
प्लेट - 5
सजावट प्लेट - 8
कालीन ब्रोड - 120
कालीन ब्रोड - 120
छोटी बनाएं - 60
उपकरण + 3 सीएफएल की - 150
10 सीएफएल छोटे - 80
झूलर - 200
झूलर घाटे - 180
कारा सेट मुखौटा - 250
कारा सेट मुखौटा - 250
कारा सेट घुमा - 220
साइड ड्रेस - 150
```

---

**All items are ready to be added to your Firestore database!**
