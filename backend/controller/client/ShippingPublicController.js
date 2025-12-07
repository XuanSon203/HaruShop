const Shipping = require('../../model/ShippingProvidersModel');

module.exports = {
  // GET /shipping
  async list(req, res) {
    try {
      // Include providers that are not explicitly inactive; support legacy docs without status
      const filter = { deleted: false };
      if (req.query.status) {
        filter.status = req.query.status;
      }
      // Exclude inactive if status exists
      filter.$or = [{ status: { $ne: 'inactive' } }, { status: { $exists: false } }];
      if (req.query.q) filter.name = { $regex: String(req.query.q), $options: 'i' };
      const items = await Shipping.find(filter)
        .select('name price methods estimated_delivery_time')
        .sort({ createdAt: -1 })
        .lean();
      return res.status(200).json({ success: true, items });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message || 'Failed to fetch shipping providers' });
    }
  },

  // GET /shipping/:id
  async get(req, res) {
  try {
    const { id } = req.params;

    if (!id || id === 'null' || id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Invalid shipping ID' });
    }

    const item = await Shipping.findOne({ _id: id })
      .select('name price methods estimated_delivery_time status')
  
    if (!item || item.status === 'inactive') {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    return res.status(200).json({ success: true, item });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
}

};


