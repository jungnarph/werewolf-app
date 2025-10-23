const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Role } = require('../models');
const { isAuthenticated } = require('../middleware/auth');
const { Op } = require('sequelize');

// Helper function to generate file hash from buffer
const generateFileHashFromBuffer = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

// Helper function to generate file hash from file path
const generateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
};

// Helper function to check if hash exists in uploads folder
const checkHashInUploadsFolder = async (newFileHash, uploadsDir) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      if (fs.statSync(filePath).isFile()) {
        const existingHash = await generateFileHash(filePath);
        if (existingHash === newFileHash) {
          return { exists: true, filename: file, path: filePath };
        }
      }
    }
    
    return { exists: false };
  } catch (error) {
    console.error('Error checking uploads folder:', error);
    return { exists: false };
  }
};

// Configure multer to store in memory first (so we can check hash before saving)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
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
    console.error('Error fetching roles:', error);
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

// Create role with duplicate detection
router.post('/', isAuthenticated, upload.single('image'), async (req, res) => {
  let savedFilePath = null;
  
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
      // Generate hash from the uploaded buffer (before saving)
      const imageHash = generateFileHashFromBuffer(req.file.buffer);
      
      // Check if hash exists in database
      const existingRole = await Role.findOne({ 
        where: { image_hash: imageHash }
      });
      
      if (existingRole) {
        return res.status(400).json({ 
          error: `This image is already used by the role "${existingRole.name}"`,
          duplicateRole: {
            id: existingRole.id,
            name: existingRole.name
          }
        });
      }
      
      // Check if hash exists in uploads folder (orphaned files)
      const uploadsDir = path.join(__dirname, '..', 'uploads', 'roles');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const folderCheck = await checkHashInUploadsFolder(imageHash, uploadsDir);
      
      if (folderCheck.exists) {
        // Reuse the existing file instead of creating a duplicate
        console.log(`Reusing existing file: ${folderCheck.filename}`);
        roleData.image_url = `/uploads/roles/${folderCheck.filename}`;
        roleData.image_hash = imageHash;
      } else {
        // No duplicate found, save the new file
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(req.file.originalname)}`;
        savedFilePath = path.join(uploadsDir, uniqueName);
        
        fs.writeFileSync(savedFilePath, req.file.buffer);
        
        roleData.image_url = `/uploads/roles/${uniqueName}`;
        roleData.image_hash = imageHash;
      }
    }
    
    const role = await Role.create(roleData);
    res.status(201).json(role);
  } catch (error) {
    // Clean up saved file if role creation failed
    if (savedFilePath && fs.existsSync(savedFilePath)) {
      fs.unlinkSync(savedFilePath);
    }
    console.error('Create role error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update role with duplicate detection
router.put('/:id', isAuthenticated, upload.single('image'), async (req, res) => {
  let savedFilePath = null;
  
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
      // Generate hash from the uploaded buffer (before saving)
      const imageHash = generateFileHashFromBuffer(req.file.buffer);
      
      // Check if this exact same image is already being used by another role
      const existingRole = await Role.findOne({ 
        where: { 
          image_hash: imageHash,
          id: { [Op.ne]: role.id }
        }
      });
      
      if (existingRole) {
        return res.status(400).json({ 
          error: `This image is already used by the role "${existingRole.name}"`,
          duplicateRole: {
            id: existingRole.id,
            name: existingRole.name
          }
        });
      }
      
      // Check if hash exists in uploads folder
      const uploadsDir = path.join(__dirname, '..', 'uploads', 'roles');
      const folderCheck = await checkHashInUploadsFolder(imageHash, uploadsDir);
      
      let newImageUrl;
      
      if (folderCheck.exists) {
        // Reuse existing file
        console.log(`Reusing existing file: ${folderCheck.filename}`);
        newImageUrl = `/uploads/roles/${folderCheck.filename}`;
      } else {
        // Save new file
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(req.file.originalname)}`;
        savedFilePath = path.join(uploadsDir, uniqueName);
        
        fs.writeFileSync(savedFilePath, req.file.buffer);
        newImageUrl = `/uploads/roles/${uniqueName}`;
      }
      
      // Delete old image if it exists and is different
      if (role.image_url && role.image_url !== newImageUrl) {
        const oldPath = path.join(__dirname, '..', role.image_url);
        if (fs.existsSync(oldPath)) {
          // Check if any other role is using this file
          const otherRoleUsingFile = await Role.findOne({
            where: {
              image_url: role.image_url,
              id: { [Op.ne]: role.id }
            }
          });
          
          // Only delete if no other role is using it
          if (!otherRoleUsingFile) {
            fs.unlinkSync(oldPath);
            console.log(`Deleted old image: ${oldPath}`);
          }
        }
      }
      
      updates.image_url = newImageUrl;
      updates.image_hash = imageHash;
    }
    
    await role.update(updates);
    res.json(role);
  } catch (error) {
    // Clean up saved file if update failed
    if (savedFilePath && fs.existsSync(savedFilePath)) {
      fs.unlinkSync(savedFilePath);
    }
    console.error('Update role error:', error);
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
    
    // Check if any other role is using the same image
    if (role.image_url) {
      const otherRoleUsingImage = await Role.findOne({
        where: {
          image_url: role.image_url,
          id: { [Op.ne]: role.id }
        }
      });
      
      // Only delete file if no other role is using it
      if (!otherRoleUsingImage) {
        const imagePath = path.join(__dirname, '..', role.image_url);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`Deleted image: ${imagePath}`);
        }
      } else {
        console.log(`Image kept because it's used by role: ${otherRoleUsingImage.name}`);
      }
    }
    
    await role.destroy();
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;