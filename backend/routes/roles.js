const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Role } = require('../models');
const { isAuthenticated } = require('../middleware/auth');

// Simple local file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/roles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP allowed'));
    }
  }
});

// Get all roles
router.get('/', async (req, res) => {
  try {
    const roles = await Role.findAll({
      order: [['created_at', 'DESC']]
    });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single role
router.get('/:id', async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create role
router.post('/', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { name, description, team, score } = req.body;
    
    const roleData = {
      name,
      description,
      team,
      score: parseInt(score),
      created_by: req.user.id
    };
    
    if (req.file) {
      roleData.image_url = `/uploads/roles/${req.file.filename}`;
    }
    
    const role = await Role.create(roleData);
    res.status(201).json(role);
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// Update role
router.put('/:id', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    const { name, description, team, score } = req.body;
    
    const updates = {
      name,
      description,
      team,
      score: parseInt(score)
    };
    
    if (req.file) {
      if (role.image_url) {
        const oldPath = path.join(__dirname, '..', role.image_url);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      updates.image_url = `/uploads/roles/${req.file.filename}`;
    }
    
    await role.update(updates);
    res.json(role);
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete role
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    if (role.image_url) {
      const imagePath = path.join(__dirname, '..', role.image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await role.destroy();
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;