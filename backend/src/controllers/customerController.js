import * as dbBridge from '../utils/dbBridge.js';

export const getAllCustomers = async (req, res) => {
  try {
    const list = await dbBridge.getCustomers();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCustomerByCIF = async (req, res) => {
  try {
    const customer = await dbBridge.getCustomer(req.params.cif);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    
    const profile = await dbBridge.getBehaviorProfile(req.params.cif);
    const customerObj = customer.toObject ? customer.toObject() : JSON.parse(JSON.stringify(customer));
    customerObj.behaviorProfile = profile || null;
    
    res.json(customerObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getGuardianByCIF = async (req, res) => {
  try {
    const guardians = await dbBridge.getGuardians(req.params.cif);
    if (guardians.length === 0) {
      return res.status(404).json({ error: 'No guardian registered for this account' });
    }
    res.json(guardians[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const enrollGuardian = async (req, res) => {
  try {
    const { cif } = req.params;
    const { guardianName, relationship, phone } = req.body;
    if (!guardianName || !relationship || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    await dbBridge.addGuardian({ cif, guardianName, relationship, phone });

    await dbBridge.addAuditLog({
      timestamp: new Date().toISOString(),
      user: 'Customer security portal',
      event: `Guardian Enrolled: ${guardianName} (${relationship})`,
      riskScore: 5,
      riskFactors: [],
      decision: 'GUARDIAN_ENROLLED'
    });

    res.status(201).json({ cif, guardianName, relationship, phone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const registerCustomer = async (req, res) => {
  try {
    const { name, balance, currentDevice } = req.body;
    if (!name || balance === undefined) {
      return res.status(400).json({ error: 'Name and starting balance are required' });
    }

    // Auto-resolve Client IP from Request
    const resolvedIP = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    // Auto-resolve Geolocation from IP
    let resolvedLocation = "Mumbai, IN";
    if (resolvedIP === '127.0.0.1' || resolvedIP === '::1') {
      const cities = ["Mumbai, IN", "Delhi, IN", "Bengaluru, IN", "Jaipur, IN", "Pune, IN"];
      resolvedLocation = cities[Math.floor(Math.random() * cities.length)];
    } else {
      // Simulate real-world IP lookup
      resolvedLocation = "Jaipur, IN";
    }

    const cif = `CIF10000${Math.floor(100000 + Math.random() * 900000)}`;
    const newCustomer = {
      cif,
      name,
      balance: parseFloat(balance),
      trustScore: 90, // starts at high trust
      currentDevice: currentDevice || 'Web Browser',
      currentIP: resolvedIP,
      currentLocation: resolvedLocation,
      loginHistory: [],
      avgTransactionAmount: Math.floor(balance * 0.1) || 5000,
      dailyAverageAmount: Math.floor(balance * 0.3) || 20000,
      accessFrequency: 5
    };
    const saved = await dbBridge.addCustomer(newCustomer);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCustomerLocation = async (req, res) => {
  try {
    const { cif } = req.params;
    const { ip, location } = req.body;
    await dbBridge.updateCustomer(cif, { currentIP: ip, currentLocation: location });
    res.json({ success: true, ip, location });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
