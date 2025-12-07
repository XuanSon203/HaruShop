const Shipping = require('../../model/ShippingProvidersModel');

module.exports = {
  // GET /admin/shipping
  async list(req, res) {
    try {
      const filter = {};
      // optional query filters
      if (req.query.status) filter.status = req.query.status;
      if (req.query.q) filter.name = { $regex: String(req.query.q), $options: 'i' };
      if (req.query.deleted === 'false') filter.deleted = false;
      const items = await Shipping.find(filter).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, items });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message || 'Failed to fetch shipping providers' });
    }
  },

  // GET /admin/shipping/:id
  async get(req, res) {
    try {
      const { id } = req.params;
      // Validate ID
      if (!id || id === 'null' || id === 'undefined') {
        return res.status(400).json({ success: false, message: 'Invalid shipping ID' });
      }
      const item = await Shipping.findById(id);
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      return res.status(200).json({ success: true, item });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message || 'Failed to fetch item' });
    }
  },

  // POST /admin/shipping
  async create(req, res) {
    try {
      const payload = {
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        address: Array.isArray(req.body.address)
          ? req.body.address
          : (req.body.address ? [req.body.address] : []),
        estimated_delivery_time: req.body.estimated_delivery_time,
        methods: Array.isArray(req.body.methods) ? req.body.methods.map(m => ({
          name: m.name,
          price: Number(m.price ?? 0),
          estimated_time: m.estimated_time,
          description: m.description,
        })) : undefined,
        status: req.body.status || undefined,
      };
      const item = await Shipping.create(payload);
      return res.status(201).json({ success: true, item, message: 'Created' });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message || 'Failed to create' });
    }
  },

  // PUT /admin/shipping/:id
  async update(req, res) {
    try {
      const update = {
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        address: Array.isArray(req.body.address)
          ? req.body.address
          : (req.body.address ? [req.body.address] : undefined),
        estimated_delivery_time: req.body.estimated_delivery_time,
        methods: Array.isArray(req.body.methods)
          ? req.body.methods.map(m => ({
              name: m.name,
              price: Number(m.price ?? 0),
              estimated_time: m.estimated_time,
              description: m.description,
            }))
          : undefined,
        status: req.body.status,
      };
      Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
      const item = await Shipping.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      return res.status(200).json({ success: true, item, message: 'Updated' });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message || 'Failed to update' });
    }
  },

  // DELETE /admin/shipping/:id
  async remove(req, res) {
    try {
      const item = await Shipping.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      return res.status(200).json({ success: true, message: 'Deleted' });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message || 'Failed to delete' });
    }
  },
};


