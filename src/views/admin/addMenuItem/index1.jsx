import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Button,
  useToast,
  useColorModeValue,
  Text,
  Spinner,
} from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AddMenuItemForm() {
  // Chakra Color Mode
  const boxBg = useColorModeValue('secondaryGray.300', 'whiteAlpha.100');
  const toast = useToast();

  // State for form data
  const [formData, setFormData] = useState({
	name: '',
	price: '',
	description: '',
	subCategory_id: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);

  // Fetch subcategories on component mount
  useEffect(() => {
	const fetchSubCategories = async () => {
	  try {
		const baseUrl = process.env.REACT_APP_BASE_URL;
		const token = localStorage.getItem('token') || '';
		const response = await axios.get(`${baseUrl}api/subCategory/getSubCategoriesSubAdmin`, {
		  headers: token ? { Authorization: `Bearer ${token}` } : {},
		});
		setCategories(response.data || []);
	  } catch (err) {
		console.error('SubCategories Fetch Error:', err.response || err.message);
		setCategoriesError('Failed to fetch subcategories. Please try again.');
	  } finally {
		setCategoriesLoading(false);
	  }
	};

	fetchSubCategories();
  }, []);

  // Handle text input changes
  const handleInputChange = (e) => {
	const { name, value } = e.target;
	setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file input change
  const handleFileChange = (e) => {
	setImageFile(e.target.files[0]);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
	e.preventDefault();
	if (!formData.name || !formData.price || !formData.subCategory_id) {
	  toast({
		title: 'Error',
		description: 'Please fill in all required fields.',
		status: 'error',
		duration: 5000,
		isClosable: true,
	  });
	  return;
	}

	setFormLoading(true);
	try {
	  const baseUrl = process.env.REACT_APP_BASE_URL;
	  const token = localStorage.getItem('token') || '';
	  const formDataToSend = new FormData();
	  formDataToSend.append('name', formData.name);
	  formDataToSend.append('price', parseFloat(formData.price));
	  formDataToSend.append('description', formData.description);
	  formDataToSend.append('subCategory_id', formData.subCategory_id);
	  if (imageFile) {
		formDataToSend.append('image', imageFile);
	  }

	  await axios.post(`${baseUrl}api/menuItem/add`, formDataToSend, {
		headers: {
		  ...(token ? { Authorization: `Bearer ${token}` } : {}),
		  'Content-Type': 'multipart/form-data',
		},
	  });

	  toast({
		title: 'Success',
		description: 'Menu item added successfully!',
		status: 'success',
		duration: 5000,
		isClosable: true,
	  });

	  // Reset form
	  setFormData({
		name: '',
		price: '',
		description: '',
		subCategory_id: '',
	  });
	  setImageFile(null);
	} catch (err) {
	  console.error('Form Submission Error:', err.response || err.message);
	  toast({
		title: 'Error',
		description: 'Failed to add menu item. Please try again.',
		status: 'error',
		duration: 5000,
		isClosable: true,
	  });
	} finally {
	  setFormLoading(false);
	}
  };

  return (
	<Box
	  pt={{ base: '130px', md: '80px', xl: '80px' }}
	  p="20px"
	  bg={boxBg}
	  borderRadius="lg"
	>
	  <Text fontSize="xl" fontWeight="bold" mb="4">
		Add Menu Item
	  </Text>
	  {categoriesLoading ? (
		<Box textAlign="center">
		  <Spinner size="md" />
		  <Text mt="2">Loading subcategories...</Text>
		</Box>
	  ) : categoriesError ? (
		<Box textAlign="center">
		  <Text color="red.500">{categoriesError}</Text>
		</Box>
	  ) : (
		<form onSubmit={handleSubmit}>
		  <FormControl mb="4" isRequired>
			<FormLabel>Name</FormLabel>
			<Input
			  name="name"
			  value={formData.name}
			  onChange={handleInputChange}
			  placeholder="Enter menu item name"
			/>
		  </FormControl>
		  <FormControl mb="4" isRequired>
			<FormLabel>Price (₹)</FormLabel>
			<Input
			  name="price"
			  type="number"
			  value={formData.price}
			  onChange={handleInputChange}
			  placeholder="Enter price"
			/>
		  </FormControl>
		  <FormControl mb="4">
			<FormLabel>Description</FormLabel>
			<Textarea
			  name="description"
			  value={formData.description}
			  onChange={handleInputChange}
			  placeholder="Enter description (optional)"
			/>
		  </FormControl>
		  <FormControl mb="4">
			<FormLabel>Image</FormLabel>
			<Input
			  name="image"
			  type="file"
			  accept="image/*"
			  onChange={handleFileChange}
			/>
		  </FormControl>
		  <FormControl mb="4" isRequired>
			<FormLabel>SubCategory</FormLabel>
			<Select
			  name="subCategory_id"
			  value={formData.subCategory_id}
			  onChange={handleInputChange}
			  placeholder="Select subcategory"
			>
			  {categories.map((category) => (
				<option key={category._id} value={category._id}>
				  {category.name}
				</option>
			  ))}
			</Select>
		  </FormControl>
		  <Button
			type="submit"
			colorScheme="brand"
			isLoading={formLoading}
			loadingText="Submitting"
		  >
			Add Menu Item
		  </Button>
		</form>
	  )}
	</Box>
  );
}
