const router = require('express').Router();
const { Deck, DeckRole, Role } = require('../models');
const { isAuthenticated } = require('../middleware/auth');

// Get all user's decks
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const decks = await Deck.findAll({
      where: { created_by: req.user.id },
      include: [{
        model: DeckRole,
        include: [Role]
      }],
      order: [['created_at', 'DESC']]
    });
    res.json(decks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single deck
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const deck = await Deck.findOne({
      where: { 
        id: req.params.id,
        created_by: req.user.id 
      },
      include: [{
        model: DeckRole,
        include: [Role]
      }]
    });
    
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    res.json(deck);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create deck
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { name, roles } = req.body;
    
    const deck = await Deck.create({
      name,
      created_by: req.user.id
    });
    
    if (roles && roles.length > 0) {
      const deckRoles = roles.map(r => ({
        deck_id: deck.id,
        role_id: r.role_id,
        quantity: r.quantity
      }));
      await DeckRole.bulkCreate(deckRoles);
    }
    
    const completeDeck = await Deck.findByPk(deck.id, {
      include: [{
        model: DeckRole,
        include: [Role]
      }]
    });
    
    res.status(201).json(completeDeck);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update deck
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const deck = await Deck.findOne({
      where: { 
        id: req.params.id,
        created_by: req.user.id 
      }
    });
    
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    const { name, roles } = req.body;
    
    await deck.update({ name });
    
    if (roles) {
      await DeckRole.destroy({ where: { deck_id: deck.id } });
      
      if (roles.length > 0) {
        const deckRoles = roles.map(r => ({
          deck_id: deck.id,
          role_id: r.role_id,
          quantity: r.quantity
        }));
        await DeckRole.bulkCreate(deckRoles);
      }
    }
    
    const updatedDeck = await Deck.findByPk(deck.id, {
      include: [{
        model: DeckRole,
        include: [Role]
      }]
    });
    
    res.json(updatedDeck);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete deck
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const deck = await Deck.findOne({
      where: { 
        id: req.params.id,
        created_by: req.user.id 
      }
    });
    
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    await deck.destroy();
    res.json({ message: 'Deck deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;