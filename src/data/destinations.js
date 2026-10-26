const imageUrl = (photoId) =>
    `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=720&q=72`;

export const destinationFallbackImage = "/destination-fallback.svg";

const destinations = [
    {
        name: "Goa",
        country: "India",
        description: "Beaches, local seafood, Portuguese heritage and a lively coastal culture.",
        image: imageUrl("photo-1512343879784-a960bf40e7f2"),
    },
    {
        name: "Dubai",
        country: "UAE",
        description: "Modern architecture, desert adventures, shopping and waterfront dining.",
        image: imageUrl("photo-1512453979798-5ea266f8880c"),
    },
    {
        name: "Paris",
        country: "France",
        description: "Iconic landmarks, riverside walks, art museums and neighborhood cafes.",
        image: imageUrl("photo-1502602898657-3e91760cbb34"),
    },
    {
        name: "Bali",
        country: "Indonesia",
        description: "Island beaches, temples, rice terraces and volcanic landscapes.",
        image: imageUrl("photo-1537996194471-e657df975ab4"),
    },
    {
        name: "London",
        country: "United Kingdom",
        description: "Historic sights, world-class museums, parks and lively markets.",
        image: imageUrl("photo-1513635269975-59663e0ac1ad"),
    },
    {
        name: "New York",
        country: "USA",
        description: "A city of famous skyline views, distinct neighborhoods and late nights.",
        image: imageUrl("photo-1618243539083-50d8840e122f"),
    },
    {
        name: "Mussoorie",
        country: "India",
        aliases: ["Musoorie"],
        description: "Himalayan viewpoints, forest trails and old hill-station streets.",
        image: imageUrl("photo-1597074866923-dc0589150358"),
    },
    {
        name: "Black Forest",
        country: "Germany",
        description: "Woodland hikes, traditional villages and scenic mountain roads.",
        image: imageUrl("photo-1448375240586-882707db888b"),
    },
    {
        name: "Tokyo",
        country: "Japan",
        description: "Neon-lit districts, quiet shrines, creative food and easy rail travel.",
        image: imageUrl("photo-1784322127965-2f5744af4fd9"),
    },
    {
        name: "Jaipur",
        country: "India",
        description: "Pink-hued architecture, historic forts, craft markets and Rajasthani food.",
        image: imageUrl("photo-1599661046827-dacff0c0f09a"),
    },
    {
        name: "Agra",
        country: "India",
        description: "Mughal-era landmarks, gardens and the Taj Mahal at sunrise.",
        image: imageUrl("photo-1564507592333-c60657eea523"),
    },
    {
        name: "Manali",
        country: "India",
        description: "Mountain scenery, riverside walks and high-altitude day trips.",
        image: imageUrl("photo-1626621341517-bbf3d9990a23"),
    },
    {
        name: "Kerala",
        country: "India",
        description: "Backwaters, tea-growing hills, wildlife and a relaxed coastal pace.",
        image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bd/Kerala_backwaters%2C_Houseboat%2C_Cruise%2C_India.jpg/960px-Kerala_backwaters%2C_Houseboat%2C_Cruise%2C_India.jpg",
        imageCredit: {
            label: "Vyacheslav Argenberg · CC BY 4.0",
            url: "https://commons.wikimedia.org/wiki/File:Kerala_backwaters,_Houseboat,_Cruise,_India.jpg",
        },
    },
    {
        name: "Udaipur",
        country: "India",
        description: "Lakefront palaces, old-city lanes and sunset boat rides.",
        image: imageUrl("photo-1695956353120-54ce5e91632b"),
    },
    {
        name: "Varanasi",
        country: "India",
        description: "Riverside ghats, historic alleys and a deeply rooted cultural life.",
        image: imageUrl("photo-1561361513-2d000a50f0dc"),
    },
    {
        name: "Singapore",
        country: "Singapore",
        description: "Garden architecture, hawker centers and an easy-to-navigate city.",
        image: imageUrl("photo-1525625293386-3f8f99389edd"),
    },
    {
        name: "Rome",
        country: "Italy",
        description: "Ancient landmarks, neighborhood trattorias and layers of living history.",
        image: imageUrl("photo-1552832230-c0197dd311b5"),
    },
    {
        name: "Kyoto",
        country: "Japan",
        description: "Temple gardens, traditional streets and seasonal scenery.",
        image: imageUrl("photo-1493976040374-85c8e12f0c0e"),
    },
    {
        name: "Istanbul",
        country: "Türkiye",
        description: "Historic mosques, ferry crossings, bazaars and layered food culture.",
        image: imageUrl("photo-1524231757912-21f4fe3a7200"),
    },
    {
        name: "Bangkok",
        country: "Thailand",
        description: "Temple visits, street food, river ferries and energetic night markets.",
        image: imageUrl("photo-1508009603885-50cf7c579365"),
    },
    {
        name: "Amsterdam",
        country: "Netherlands",
        description: "Canal-side walks, galleries, cycling routes and independent cafes.",
        image: imageUrl("photo-1512470876302-972faa2aa9a4"),
    },
    {
        name: "Barcelona",
        country: "Spain",
        description: "Distinctive architecture, Mediterranean beaches and late dining.",
        image: imageUrl("photo-1583422409516-2895a77efded"),
    },
    {
        name: "Santorini",
        country: "Greece",
        description: "Cliffside villages, caldera views and quiet island coves.",
        image: imageUrl("photo-1533105079780-92b9be482077"),
    },
    {
        name: "Maldives",
        country: "Maldives",
        description: "Atolls, coral reefs and calm Indian Ocean waters.",
        image: imageUrl("photo-1514282401047-d79a71a590e8"),
    },
    {
        name: "Sydney",
        country: "Australia",
        description: "Harbor landmarks, coastal walks and a relaxed beach-city rhythm.",
        image: imageUrl("photo-1506973035872-a4ec16b8e8d9"),
    },
    {
        name: "Cape Town",
        country: "South Africa",
        description: "Mountain trails, ocean viewpoints, gardens and nearby vineyards.",
        image: imageUrl("photo-1580060839134-75a5edca2e99"),
    },
    {
        name: "Vancouver",
        country: "Canada",
        description: "A walkable waterfront, mountain backdrops and green city parks.",
        image: imageUrl("photo-1559511260-66a654ae982a"),
    },
    {
        name: "Cairo",
        country: "Egypt",
        description: "Ancient monuments, museums and the lively streets of a vast city.",
        image: imageUrl("photo-1572252009286-268acec5ca0a"),
    },
    {
        name: "Machu Picchu",
        country: "Peru",
        description: "Mountain scenery and a remarkable archaeological site in the Andes.",
        image: imageUrl("photo-1526392060635-9d6019884377"),
    },
    {
        name: "Prague",
        country: "Czechia",
        description: "A compact old town, riverside views and striking historic architecture.",
        image: imageUrl("photo-1519677100203-a0e668c92439"),
    },
    {
        name: "Lisbon",
        country: "Portugal",
        description: "Hillside viewpoints, tiled streets, coastal day trips and vibrant food.",
        image: imageUrl("photo-1555881400-74d7acaacd8b"),
    },
    {
        name: "Florence",
        country: "Italy",
        description: "Renaissance art, walkable piazzas and Tuscan food and wine.",
        image: imageUrl("photo-1581951756710-084ff9f7b0ca"),
    },
    {
        name: "Venice",
        country: "Italy",
        description: "Canals, historic bridges, quiet squares and lagoon islands.",
        image: imageUrl("photo-1514890547357-a9ee288728e0"),
    },
    {
        name: "Reykjavik",
        country: "Iceland",
        description: "Colorful streets, geothermal pools and easy access to dramatic landscapes.",
        image: imageUrl("photo-1504829857797-ddff29c27927"),
    },
    {
        name: "Queenstown",
        country: "New Zealand",
        description: "Alpine lake views, scenic trails and outdoor adventures.",
        image: imageUrl("photo-1507699622108-4be3abd695ad"),
    },
    {
        name: "Seoul",
        country: "South Korea",
        description: "Palaces, contemporary neighborhoods, mountain walks and late-night food.",
        image: imageUrl("photo-1517154421773-0529f29ea451"),
    },
    {
        name: "Hanoi",
        country: "Vietnam",
        description: "Old-quarter streets, lakeside walks and celebrated Vietnamese cuisine.",
        image: imageUrl("photo-1509030450996-dd1a26dda07a"),
    },
    {
        name: "Kuala Lumpur",
        country: "Malaysia",
        description: "Skyline landmarks, lively markets and a rich mix of local cuisines.",
        image: imageUrl("photo-1596422846543-75c6fc197f07"),
    },
    {
        name: "Mexico City",
        country: "Mexico",
        description: "World-class museums, historic neighborhoods and an exciting food scene.",
        image: imageUrl("photo-1518105779142-d975f22f1b0a"),
    },
    {
        name: "Rio de Janeiro",
        country: "Brazil",
        description: "Mountain-backed beaches, samba culture and sweeping city viewpoints.",
        image: imageUrl("photo-1483729558449-99ef09a8c325"),
    },
    {
        name: "Buenos Aires",
        country: "Argentina",
        description: "Grand boulevards, neighborhood cafes, tango and late-night dining.",
        image: imageUrl("photo-1612294037637-ec328d0e075e"),
    },
    {
        name: "Marrakech",
        country: "Morocco",
        description: "Medina lanes, garden courtyards, souks and Atlas Mountain day trips.",
        image: imageUrl("photo-1597212618440-806262de4f6b"),
    },
    {
        name: "Zanzibar",
        country: "Tanzania",
        description: "Indian Ocean beaches, historic Stone Town and spice island tours.",
        image: imageUrl("photo-1510414842594-a61c69b5ae57"),
    },
    {
        name: "Banff",
        country: "Canada",
        description: "Turquoise alpine lakes, mountain trails and wildlife-rich parkland.",
        image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/Banff_National_Park_Lake_May_2024.jpg/960px-Banff_National_Park_Lake_May_2024.jpg",
        imageCredit: {
            label: "Gaya.psd · CC BY-SA 4.0",
            url: "https://commons.wikimedia.org/wiki/File:Banff_National_Park_Lake_May_2024.jpg",
        },
    },
];

const destinationImageByName = new Map(
    destinations.flatMap((destination) =>
        [destination.name, ...(destination.aliases || [])].map((name) => [
            name.trim().toLowerCase(),
            destination.image,
        ])
    )
);
const additionalDestinationImages = new Map([
    ["mumbai", imageUrl("photo-1570168007204-dfb528c6958f")],
    ["rishikesh", imageUrl("photo-1626621341517-bbf3d9990a23")],
    ["mysuru", imageUrl("photo-1599661046827-dacff0c0f09a")],
    ["varkala", imageUrl("photo-1512343879784-a960bf40e7f2")],
    ["darjeeling", imageUrl("photo-1597074866923-dc0589150358")],
    ["kathmandu", imageUrl("photo-1544735716-392fe2489ffa")],
]);
const destinationImagePool = destinations.map((destination) => destination.image);

export const getDestinationImage = (destinationName, preferredImage) => {
    if (typeof preferredImage === "string" && preferredImage.trim()) {
        return preferredImage.trim();
    }

    const normalizedName = String(destinationName || "")
        .split(",")[0]
        .trim()
        .toLowerCase();

    const knownImage =
        destinationImageByName.get(normalizedName) ||
        additionalDestinationImages.get(normalizedName);
    if (knownImage) return knownImage;

    const imageIndex = Array.from(normalizedName).reduce(
        (total, character) => total + character.codePointAt(0),
        0
    ) % destinationImagePool.length;

    return destinationImagePool[imageIndex] || destinationFallbackImage;
};

export default destinations;