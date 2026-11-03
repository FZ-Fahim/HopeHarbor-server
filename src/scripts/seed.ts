import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'hopeharbor';

if (!uri) {
  console.error('❌ MONGODB_URI is not defined in .env');
  process.exit(1);
}

// Helper to create dates N days into the future
const getFutureDate = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(10, 0, 0, 0); // 10:00 AM
  return d;
};

// 10 Realistic Community Service Events (Matching Assignment Guidelines)
const seedEvents = [
  {
    title: 'Winter Clothes Distribution for Underprivileged Families',
    description:
      'Collecting and distributing clean, warm winter jackets, sweaters, and woolen caps to over 250 low-income families and children residing near the Mirpur 10 roundabout. Volunteers will assist in sorting sizes, cataloging donations, and orderly queue distribution.',
    eventType: 'Donation',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800',
    location: 'Mirpur 10 Community Center, Dhaka',
    date: getFutureDate(3),
    organizerEmail: 'organizer@hopeharbor.org',
    organizerName: 'Tahsin Ahmed',
    attendeesCount: 14,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Blanket Distribution for the Needy & Street Dwellers',
    description:
      'An emergency cold-wave relief initiative providing heavy thermal blankets to homeless citizens and night laborers across Mohammadpur and Town Hall. Volunteers will assemble at Town Hall before proceeding on foot distribution routes.',
    eventType: 'Donation',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=800',
    location: 'Mohammadpur Town Hall Ground, Dhaka',
    date: getFutureDate(5),
    organizerEmail: 'organizer@hopeharbor.org',
    organizerName: 'Ayesha Rahman',
    attendeesCount: 22,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Rayer Bazar Canal Cleanliness & Waste Extraction Drive',
    description:
      'A community-led environmental drive to remove plastic waste and debris from the canal perimeter to prevent local waterlogging and dengue breeding. Protective gloves, masks, and waste collection sacks will be supplied to all volunteers.',
    eventType: 'Cleanup',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&q=80&w=800',
    location: 'Rayer Bazar Sluice Gate Area, Dhaka',
    date: getFutureDate(7),
    organizerEmail: 'clean.dhaka@hopeharbor.org',
    organizerName: 'Kazi Farhan',
    attendeesCount: 18,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Urban Afforestation & Native Fruit Tree Plantation',
    description:
      'Planting 500 indigenous fruit-bearing and oxygen-producing saplings along public walkways and schools in Uttara Sector 11. Families and school students are encouraged to adopt and monitor sapling growth throughout the year.',
    eventType: 'Plantation',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800',
    location: 'Uttara Sector 11 Public Park, Dhaka',
    date: getFutureDate(10),
    organizerEmail: 'green.future@hopeharbor.org',
    organizerName: 'Nusrat Jahan',
    attendeesCount: 31,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Free Basic Health Screening & Pediatric Medical Camp',
    description:
      'Providing volunteer-backed general health checkups, blood pressure screenings, blood glucose tests, and basic OTC medical supplies to day laborers, domestic staff, and children with zero access to private clinics.',
    eventType: 'Healthcare',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=800',
    location: 'Badda High School Grounds, Dhaka',
    date: getFutureDate(12),
    organizerEmail: 'health.aid@hopeharbor.org',
    organizerName: 'Dr. Rafiqul Islam',
    attendeesCount: 26,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Children’s Book Sharing & Literacy Circle',
    description:
      'Setting up pop-up open-air libraries and story reading sessions for street children around Dhanmondi Lake. Accepting donations of children’s storybooks, sketch pads, colored pencils, and elementary school textbooks.',
    eventType: 'Education',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800',
    location: 'Rabindra Sarobar, Dhanmondi, Dhaka',
    date: getFutureDate(15),
    organizerEmail: 'literacy.bd@hopeharbor.org',
    organizerName: 'Mahira Chowdhury',
    attendeesCount: 19,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Dry Food Parcel Preparation for Riverbank Communities',
    description:
      'Volunteers will assemble 400 durable family food kits containing rice, lentils, edible oil, iodine salt, and water purification tablets for seasonal flood-prone households in the outskirts of Dhaka.',
    eventType: 'Relief',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1594708767771-a7502209ff51?auto=format&fit=crop&q=80&w=800',
    location: 'Gabtoli Warehouse Hub, Dhaka',
    date: getFutureDate(18),
    organizerEmail: 'relief.network@hopeharbor.org',
    organizerName: 'Tanvir Hossain',
    attendeesCount: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Neighborhood Anti-Dengue Spraying & Awareness Drive',
    description:
      'Educating local residents on eliminating stagnant rooftop water and assisting municipality spray operators in high-risk residential alleys in Old Dhaka.',
    eventType: 'Cleanup',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&q=80&w=800',
    location: 'Lalbagh Fort Perimeter, Old Dhaka',
    date: getFutureDate(21),
    organizerEmail: 'safecity@hopeharbor.org',
    organizerName: 'Shakil Anwar',
    attendeesCount: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Emergency Warm Footwear & Sock Drive',
    description:
      'Distributing insulated socks and sturdy footwear to rickshaw pullers and night watchmen who work prolonged outdoor hours during the peak winter cold.',
    eventType: 'Donation',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&q=80&w=800',
    location: 'Farmgate Overbridge Plaza, Dhaka',
    date: getFutureDate(25),
    organizerEmail: 'organizer@hopeharbor.org',
    organizerName: 'Tahsin Ahmed',
    attendeesCount: 9,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Youth Environmental Photography Workshop & Exhibition',
    description:
      'A community workshop empowering teenagers to document urban environmental challenges and biodiversity through mobile photography, followed by an open public exhibition.',
    eventType: 'Education',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&q=80&w=800',
    location: 'Chhayanaut Cultural Center, Dhanmondi, Dhaka',
    date: getFutureDate(28),
    organizerEmail: 'artfornature@hopeharbor.org',
    organizerName: 'Zubair Al-Mamun',
    attendeesCount: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const volunteerPool = [
  { name: 'Sadia Anjum', email: 'sadia.anjum@gmail.com' },
  { name: 'Tanvir Hasan', email: 'tanvir.hasan@yahoo.com' },
  { name: 'Nabila Rahman', email: 'nabila.r@outlook.com' },
  { name: 'Kazi Farhan', email: 'kazi.farhan@dhaka.net' },
  { name: 'Sumaiya Kabir', email: 'sumaiya.k@gmail.com' },
  { name: 'Aman Ullah', email: 'aman.ullah@gmail.com' },
];

async function seedDatabase() {
  const client = new MongoClient(uri!);

  try {
    await client.connect();
    console.log('🍃 Connected to MongoDB for seeding...');

    const db = client.db(dbName);
    const eventsCollection = db.collection('events');
    const joinedEventsCollection = db.collection('joined_events');

    await eventsCollection.deleteMany({});
    await joinedEventsCollection.deleteMany({});

    const result = await eventsCollection.insertMany(seedEvents);
    let volunteerRecordsInserted = 0;

    for (let eventIndex = 0; eventIndex < seedEvents.length; eventIndex++) {
      const eventId = result.insertedIds[eventIndex];
      const assignedVolunteers = [...volunteerPool]
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 2) + 2);

      await joinedEventsCollection.insertMany(
        assignedVolunteers.map((vol) => ({
          eventId,
          userName: vol.name,
          userEmail: vol.email,
          joinedAt: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 3)),
        })),
      );
      volunteerRecordsInserted += assignedVolunteers.length;

      await eventsCollection.updateOne(
        { _id: eventId },
        { $set: { attendeesCount: assignedVolunteers.length } },
      );
    }
    console.log(`Seeded ${result.insertedCount} events and ${volunteerRecordsInserted} volunteer records into "${dbName}".`);
  } catch (error) {
    console.error('❌ Failed to seed events:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seedDatabase();
