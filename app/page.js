'use client'

import { useState, useEffect } from 'react'
import { Box, Stack, Typography, Button, Modal, TextField, MenuItem, Select, InputLabel, FormControl } from '@mui/material'
import { firestore } from '@/firebase'
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore'

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  borderRadius: '8px',
  boxShadow: 24,
  p: 4,
}

const itemBoxStyle = {
  borderRadius: '8px',
  bgcolor: '#f9f9f9',
  padding: 2,
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
}

const categories = ['Vegetable', 'Fruit', 'Dairy']

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [filteredInventory, setFilteredInventory] = useState([])
  const [openAdd, setOpenAdd] = useState(false)
  const [openUpdate, setOpenUpdate] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [weight, setWeight] = useState('')
  const [unit, setUnit] = useState('kg')
  const [category, setCategory] = useState(categories[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [minQuantity, setMinQuantity] = useState(0)
  const [maxWeight, setMaxWeight] = useState(Infinity)

  const handleOpenAdd = () => setOpenAdd(true)
  const handleCloseAdd = () => setOpenAdd(false)
  const handleOpenUpdate = (item) => {
    setCurrentItem(item)
    setItemName(item.name)
    setQuantity(item.quantity)
    setWeight(item.weight)
    setUnit(item.unit)
    setCategory(item.category)
    setOpenUpdate(true)
  }
  const handleCloseUpdate = () => setOpenUpdate(false)

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'pantry'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() })
    })
    setInventory(inventoryList)
  }
  
  useEffect(() => {
    updateInventory()
  }, [])

  useEffect(() => {
    const filtered = inventory
      .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter(item => item.quantity >= minQuantity)
      .filter(item => item.weight <= maxWeight)
    setFilteredInventory(filtered)
  }, [searchQuery, minQuantity, maxWeight, inventory])

  const addItem = async (item, quantity, weight, unit, category) => {
    const docRef = doc(collection(firestore, 'pantry'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity: currentQuantity, weight: currentWeight } = docSnap.data()
      await setDoc(docRef, { 
        quantity: currentQuantity + quantity,
        weight: (currentWeight * currentQuantity + weight * quantity) / (currentQuantity + quantity),
        unit,
        category
      })
    } else {
      await setDoc(docRef, { quantity, weight, unit, category })
    }
    await updateInventory()
  }

  const updateItem = async (item, quantity, weight, unit, category) => {
    const docRef = doc(collection(firestore, 'pantry'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      await setDoc(docRef, { quantity, weight, unit, category })
    }
    await updateInventory()
  }

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'pantry'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity, weight } = docSnap.data()
      if (quantity === 1) {
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, { quantity: quantity - 1, weight })
      }
    }
    await updateInventory()
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h2" gutterBottom align="center">Inventory Management</Typography>
      <Box
        width="100%"
        display={'flex'}
        flexDirection={'column'}
        alignItems={'center'}
        gap={2}
      >
        <Modal
          open={openAdd}
          onClose={handleCloseAdd}
          aria-labelledby="modal-add-title"
          aria-describedby="modal-add-description"
        >
          <Box sx={modalStyle}>
            <Typography id="modal-add-title" variant="h6" component="h2" gutterBottom>
              Add New Item
            </Typography>
            <Stack spacing={2}>
              <TextField
                id="item-name"
                label="Item Name"
                variant="outlined"
                fullWidth
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
              <TextField
                id="item-quantity"
                label="Quantity"
                type="number"
                variant="outlined"
                fullWidth
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                InputProps={{ inputProps: { min: 1 } }}
              />
              <TextField
                id="item-weight"
                label="Weight"
                type="number"
                variant="outlined"
                fullWidth
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || '')}
                InputProps={{ inputProps: { min: 0 } }}
              />
              <FormControl fullWidth>
                <InputLabel id="weight-unit-label">Unit</InputLabel>
                <Select
                  labelId="weight-unit-label"
                  id="weight-unit"
                  value={unit}
                  label="Unit"
                  onChange={(e) => setUnit(e.target.value)}
                >
                  <MenuItem value="kg">kg</MenuItem>
                  <MenuItem value="g">g</MenuItem>
                  <MenuItem value="mg">mg</MenuItem>
                  <MenuItem value="oz">oz</MenuItem>
                  <MenuItem value="ml">ml</MenuItem>
                  <MenuItem value="L">L</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  id="category"
                  value={category}
                  label="Category"
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  addItem(itemName, quantity, weight, unit, category)
                  setItemName('')
                  setQuantity(1)
                  setWeight('')
                  setUnit('kg')
                  setCategory(categories[0])
                  handleCloseAdd()
                }}
              >
                Add Item
              </Button>
            </Stack>
          </Box>
        </Modal>

        <Modal
          open={openUpdate}
          onClose={handleCloseUpdate}
          aria-labelledby="modal-update-title"
          aria-describedby="modal-update-description"
        >
          <Box sx={modalStyle}>
            <Typography id="modal-update-title" variant="h6" component="h2" gutterBottom>
              Update Item
            </Typography>
            <Stack spacing={2}>
              <TextField
                id="update-item-name"
                label="Item Name"
                variant="outlined"
                fullWidth
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                disabled
              />
              <TextField
                id="update-item-quantity"
                label="Quantity"
                type="number"
                variant="outlined"
                fullWidth
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                InputProps={{ inputProps: { min: 1 } }}
              />
              <TextField
                id="update-item-weight"
                label="Weight"
                type="number"
                variant="outlined"
                fullWidth
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || '')}
                InputProps={{ inputProps: { min: 0 } }}
              />
              <FormControl fullWidth>
                <InputLabel id="update-weight-unit-label">Unit</InputLabel>
                <Select
                  labelId="update-weight-unit-label"
                  id="update-weight-unit"
                  value={unit}
                  label="Unit"
                  onChange={(e) => setUnit(e.target.value)}
                >
                  <MenuItem value="kg">kg</MenuItem>
                  <MenuItem value="g">g</MenuItem>
                  <MenuItem value="mg">mg</MenuItem>
                  <MenuItem value="oz">oz</MenuItem>
                  <MenuItem value="ml">ml</MenuItem>
                  <MenuItem value="L">L</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="update-category-label">Category</InputLabel>
                <Select
                  labelId="update-category-label"
                  id="update-category"
                  value={category}
                  label="Category"
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  updateItem(itemName, quantity, weight, unit, category)
                  setItemName('')
                  setQuantity(1)
                  setWeight('')
                  setUnit('kg')
                  setCategory(categories[0])
                  handleCloseUpdate()
                }}
              >
                Update Item
              </Button>
            </Stack>
          </Box>
        </Modal>

        <Button variant="contained" color="secondary" onClick={handleOpenAdd}>
          Add New Item
        </Button>
        <Box width="100%" maxWidth="800px" mt={3}>
          <TextField
            label="Search"
            variant="outlined"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            margin="normal"
          />
          <Stack direction="row" spacing={2} mt={2}>
            <TextField
              label="Min Quantity"
              type="number"
              variant="outlined"
              value={minQuantity}
              onChange={(e) => setMinQuantity(parseInt(e.target.value, 10) || 0)}
              InputProps={{ inputProps: { min: 0 } }}
            />
            <TextField
              label="Max Weight"
              type="number"
              variant="outlined"
              value={maxWeight === Infinity ? '' : maxWeight}
              onChange={(e) => setMaxWeight(parseFloat(e.target.value) || Infinity)}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Stack>
        </Box>
        <Box
          width="100%"
          maxWidth="800px"
          mt={3}
          borderRadius="8px"
          border="1px solid #ddd"
          overflow="hidden"
        >
          <Box
            height="60px"
            bgcolor={'#3f51b5'}
            display={'flex'}
            alignItems={'center'}
            justifyContent={'center'}
          >
            <Typography variant={'h4'} color={'white'}>Inventory Items</Typography>
          </Box>
          <Stack spacing={2} p={2} overflow={'auto'}>
            {categories.map(cat => (
              <Box key={cat}>
                <Typography variant="h5" mt={2} mb={1}>{cat}</Typography>
                {filteredInventory
                  .filter(item => item.category === cat)
                  .map(({ name, quantity, weight, unit }) => (
                    <Box
                      key={name}
                      sx={itemBoxStyle}
                      display={'flex'}
                      justifyContent={'space-between'}
                      alignItems={'center'}
                      p={2}
                    >
                      <Typography variant={'h6'}>
                        {name.charAt(0).toUpperCase() + name.slice(1)}
                      </Typography>
                      <Typography variant={'body1'}>
                        Quantity: {quantity}
                      </Typography>
                      <Typography variant={'body1'}>
                        Weight: {weight} {unit}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button variant="contained" color="info" onClick={() => handleOpenUpdate({ name, quantity, weight, unit, category: cat })}>
                          Update
                        </Button>
                        <Button variant="contained" color="error" onClick={() => removeItem(name)}>
                          Remove
                        </Button>
                      </Stack>
                    </Box>
                  ))}
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}
