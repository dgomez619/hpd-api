const ical = require('node-ical');
const Property = require('../models/Property');

const syncExternalCalendars = async (propertyId) => {
  try {
    const property = await Property.findById(propertyId);
    if (!property || !property.externalSyncLinks.length) return;

    let newBlockedDates = [];

    // 1. Keep existing "Manual" or "Direct-Booking" blocks
    // We only want to refresh the 'Airbnb' and 'Booking.com' ones
    newBlockedDates = property.blockedDates.filter(
      block => block.source === 'Manual' || block.source === 'Direct-Booking'
    );

    // 2. Loop through each external link (Airbnb, Booking, etc.)
    for (const link of property.externalSyncLinks) {
      const webEvents = await ical.fromURL(link.url);

      for (let k in webEvents) {
        const event = webEvents[k];
        if (event.type !== 'VEVENT') continue;

        // 3. Create the block object
        newBlockedDates.push({
          startDate: event.start,
          endDate: event.end,
          source: link.platform,
          externalId: event.uid,
          lastSynced: new Date()
        });
      }
      
      // Update the "Last Synced" timestamp for this specific link
      link.lastSynced = new Date();
    }

    // 4. Save the aggregated blocks back to the Property
    property.blockedDates = newBlockedDates;
    await property.save();
    
    return property;
  } catch (error) {
    console.error(`Sync failed for property ${propertyId}:`, error);
  }
};

module.exports = { syncExternalCalendars };