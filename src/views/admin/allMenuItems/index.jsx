/* eslint-disable */
'use client';

import {
  Box,
  Button,
  Flex,
  Image,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Select,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import axios from 'axios';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';

// Custom components
import Card from 'components/card/Card';

const columnHelper = createColumnHelper();

export default function ComplexTable() {
  const [sorting, setSorting] = React.useState([]);
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [selectedMenuItem, setSelectedMenuItem] = React.useState(null);
  const [editMenuItem, setEditMenuItem] = React.useState(null);
  const [subCategories, setSubCategories] = React.useState([]);
  const [formErrors, setFormErrors] = React.useState({});
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const navigate = useNavigate();

  // Fetch menu items and subcategories from API
  const baseUrl = process.env.REACT_APP_BASE_URL;
  const token = localStorage.getItem('token');

  React.useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        if (!baseUrl || !token) {
          throw new Error('Missing base URL or authentication token');
        }
        const response = await axios.get(`${baseUrl}api/menuItem/getMenuItemsByUser`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('API Response (Menu Items):', response.data);

        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Invalid response format: Expected an array of menu items');
        }

        const formattedData = response.data.map((item) => ({
          id: item._id || '',
          name: item.name || 'Unknown',
          price: item.price || 0,
          description: item.description || '',
          subCategory_id: item.subCategory_id?.name || '',
          subCategoryId: item.subCategory_id?._id || '', // Store ID for editing
          image: item.image ? `${baseUrl}${item.image}` : '',
          createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '',
        }));

        setData(formattedData);
        setLoading(false);
      } catch (err) {
        console.error('Fetch Menu Items Error:', err);
        if (
          err.response?.data?.message === 'Not authorized, token failed' ||
          err.response?.data?.message === 'Session expired or logged in on another device' ||
          err.response?.data?.message ===
            'Un-Authorized, You are not authorized to access this route.' || 'Not authorized, token failed'
        ) {
          localStorage.removeItem('token');
          navigate('/');
        } else {
          setError(err.message || 'Failed to fetch menu items');
          setLoading(false);
        }
      }
    };

    const fetchSubCategories = async () => {
      try {
        const response = await axios.get(`${baseUrl}api/subCategory/getSubCategoriesSubAdmin`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('API Response (Subcategories):', response.data);

        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Invalid response format: Expected an array of subcategories');
        }

        setSubCategories(
          response.data.map((sub) => ({
            id: sub._id,
            name: sub.name,
          }))
        );
      } catch (err) {
        console.error('Fetch Subcategories Error:', err);
        setError(err.message || 'Failed to fetch subcategories');
      }
    };

    fetchMenuItems();
    fetchSubCategories();
  }, [navigate]);

  // Validation logic
  const validateForm = () => {
    const errors = {};
    const nameRegex = /^[a-zA-Z\s]+$/; // Only letters and spaces
    const priceRegex = /^\d+(\.\d{1,2})?$/; // Positive number with up to 2 decimal places

		const trimmedName = editMenuItem?.name?.trim();

    if (!trimmedName) {
      errors.name = 'Name is required';
    } else if (!nameRegex.test(trimmedName)) {
      errors.name = 'Name can only contain letters and spaces';
    }

    if (!editMenuItem?.price) {
      errors.price = 'Price is required';
    } else if (!priceRegex.test(editMenuItem.price)) {
      errors.price = 'Price must be a positive number with up to two decimal places';
    }

    if (!editMenuItem?.description) {
      errors.description = 'Description is required';
    } else if (editMenuItem.description.length < 5) {
      errors.description = 'Description must be at least 5 characters long';
    }

    if (!editMenuItem?.subCategoryId) {
      errors.subCategoryId = 'Subcategory is required';
    }

    if (editMenuItem?.image && !['image/jpeg', 'image/png'].includes(editMenuItem.image.type)) {
      errors.image = 'File must be a JPEG or PNG image';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle view details click
  const handleViewDetails = (menuItem) => {
    setSelectedMenuItem(menuItem);
    onDetailsOpen();
  };

  // Handle edit button click
  const handleEditClick = (menuItem) => {
    setEditMenuItem({
      id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      description: menuItem.description,
      subCategoryId: menuItem.subCategoryId,
      image: null, // File input will handle new image
      currentImage: menuItem.image, // Store current image URL
    });
    setFormErrors({});
    onEditOpen();
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditMenuItem((prev) => ({
      ...prev,
      [name]: value,
    }));
    validateForm();
  };

  // Handle subcategory select change
  const handleSubCategoryChange = (e) => {
    setEditMenuItem((prev) => ({
      ...prev,
      subCategoryId: e.target.value,
    }));
    validateForm();
  };

  // Handle file input change
  const handleFileChange = (e) => {
    setEditMenuItem((prev) => ({
      ...prev,
      image: e.target.files[0],
    }));
    validateForm();
  };

  // Handle edit form submission
  const handleEditSubmit = async () => {
    if (!validateForm()) return;

    try {
      const formData = new FormData();
      formData.append('name', editMenuItem.name);
      formData.append('price', editMenuItem.price);
      formData.append('description', editMenuItem.description);
      formData.append('subCategory_id', editMenuItem.subCategoryId);
      if (editMenuItem.image) {
        formData.append('image', editMenuItem.image);
      }

      const response = await axios.put(
        `${baseUrl}api/menuItem/update/${editMenuItem.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Update the table data with the updated menu item
      setData((prev) =>
        prev.map((item) =>
          item.id === editMenuItem.id
            ? {
                ...item,
                name: response.data.name,
                price: response.data.price,
                description: response.data.description,
                subCategory_id: subCategories.find((sub) => sub.id === response.data.subCategory_id)?.name || item.subCategory_id,
                subCategoryId: response.data.subCategory_id,
                image: response.data.image ? `${baseUrl}${response.data.image}` : item.image,
                createdAt: item.createdAt,
              }
            : item
        )
      );
     window.location.href = "/admin/menuitems"
      onEditClose();
    } catch (err) {
      console.error('Update Error:', err);
      setError('Failed to update menu item');
    }
  };

  // Handle delete button click
  const handleDeleteMenuItem = async (id) => {
    try {
      await axios.delete(`${baseUrl}api/menuItem/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(data.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Delete Error:', err);
      setError('Failed to delete menu item');
    }
  };

  // Handle add menu item
  const handleAddMenu = () => {
    navigate('/admin/add-menuitem');
  };

  const columns = [
    columnHelper.accessor('image', {
      id: 'image',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          IMAGE
        </Text>
      ),
      cell: (info) => (
        <Flex align="center">
          {info.getValue() ? (
            <Image
              src={info.getValue()}
              alt="Menu Item"
              boxSize="50px"
              objectFit="cover"
              borderRadius="8px"
            />
          ) : (
            <Text color={textColor} fontSize="sm">
              No Image
            </Text>
          )}
        </Flex>
      ),
    }),
    columnHelper.accessor('name', {
      id: 'name',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          NAME
        </Text>
      ),
      cell: (info) => (
        <Flex align="center">
          <Text color={textColor} fontSize="sm" fontWeight="700">
            {info.getValue()}
          </Text>
        </Flex>
      ),
    }),
    columnHelper.accessor('price', {
      id: 'price',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          PRICE
        </Text>
      ),
      cell: (info) => (
        <Flex align="center">
          <Text color={textColor} fontSize="sm" fontWeight="700">
            ₹{info.getValue()}
          </Text>
        </Flex>
      ),
    }),
    columnHelper.accessor('description', {
      id: 'description',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          DESCRIPTION
        </Text>
      ),
      cell: (info) => (
        <Flex align="center">
          <Text color={textColor} fontSize="sm" fontWeight="700">
            {info.getValue()}
          </Text>
        </Flex>
      ),
    }),
    columnHelper.accessor('subCategory_id', {
      id: 'subCategory_id',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          SUBCATEGORY
        </Text>
      ),
      cell: (info) => (
        <Flex align="center">
          <Text color={textColor} fontSize="sm" fontWeight="700">
            {info.getValue()}
          </Text>
        </Flex>
      ),
    }),
    columnHelper.accessor('createdAt', {
      id: 'createdAt',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          CREATED AT
        </Text>
      ),
      cell: (info) => (
        <Flex align="center">
          <Text color={textColor} fontSize="sm" fontWeight="700">
            {info.getValue()}
          </Text>
        </Flex>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          ACTIONS
        </Text>
      ),
      cell: ({ row }) => (
        <Flex align="center" gap="2">
          <Button
            colorScheme="teal"
            size="sm"
            onClick={() => handleViewDetails(row.original)}
          >
            View Details
          </Button>
          <Button
            colorScheme="yellow"
            size="sm"
            onClick={() => handleEditClick(row.original)}
          >
            Edit
          </Button>
          <Button
            colorScheme="red"
            size="sm"
            leftIcon={<DeleteIcon />}
            onClick={() => handleDeleteMenuItem(row.original.id)}
          >
            Delete
          </Button>
        </Flex>
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  const isFormValid = editMenuItem && Object.keys(formErrors).length === 0;

  if (loading) {
    return (
      <Card
        flexDirection="column"
        w="100%"
        px="0px"
        overflowX={{ sm: 'scroll', lg: 'hidden' }}
      >
        <Text color={textColor} fontSize="22px" fontWeight="700" p="25px">
          Loading...
        </Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        flexDirection="column"
        w="100%"
        px="0px"
        overflowX={{ sm: 'scroll', lg: 'hidden' }}
      >
        <Text color={textColor} fontSize="22px" fontWeight="700" p="25px">
          Error: {error}
        </Text>
      </Card>
    );
  }

  return (
    <Card
      flexDirection="column"
      w="100%"
      px="0px"
      mt="100px"
      overflowX={{ sm: 'scroll', lg: 'hidden' }}
    >
      <Flex px="25px" mb="8px" justifyContent="space-between" align="center">
        <Text
          color={textColor}
          fontSize="22px"
          fontWeight="700"
          lineHeight="100%"
        >
          All Menu Items
        </Text>
        <Button colorScheme="blue" size="md" onClick={handleAddMenu}>
          Add Menu Item
        </Button>
      </Flex>
      <Box>
        <Table variant="simple" color="gray.500" mb="24px" mt="12px">
          <Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Th
                    key={header.id}
                    colSpan={header.colSpan}
                    pe="10px"
                    borderColor={borderColor}
                    cursor="pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <Flex
                      justifyContent="space-between"
                      align="center"
                      fontSize={{ sm: '10px', lg: '12px' }}
                      color="gray.400"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {{
                        asc: '',
                        desc: '',
                      }[header.column.getIsSorted()] ?? null}
                    </Flex>
                  </Th>
                ))}
              </Tr>
            ))}
          </Thead>
          <Tbody>
            {table.getRowModel().rows.map((row) => (
              <Tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <Td
                    key={cell.id}
                    fontSize={{ sm: '14px' }}
                    minW={{ sm: '150px', md: '200px', lg: 'auto' }}
                    borderColor="transparent"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
      {/* Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={onDetailsClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Menu Item Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedMenuItem && (
              <Box>
                <Text fontWeight="bold">Name:</Text>
                <Text>{selectedMenuItem.name}</Text>
                <Text fontWeight="bold" mt="4">Price:</Text>
                <Text>${selectedMenuItem.price}</Text>
                <Text fontWeight="bold" mt="4">Description:</Text>
                <Text>{selectedMenuItem.description}</Text>
                <Text fontWeight="bold" mt="4">Subcategory:</Text>
                <Text>{selectedMenuItem.subCategory_id}</Text>
                <Text fontWeight="bold" mt="4">Created At:</Text>
                <Text>{selectedMenuItem.createdAt}</Text>
                {selectedMenuItem.image && (
                  <>
                    <Text fontWeight="bold" mt="4">Image:</Text>
                    <Image
                      src={selectedMenuItem.image}
                      alt="Menu Item"
                      boxSize="100px"
                      objectFit="cover"
                      borderRadius="8px"
                    />
                  </>
                )}
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onDetailsClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Menu Item</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editMenuItem && (
              <Box>
                <FormControl isInvalid={!!formErrors.name} mb="4">
                  <FormLabel>Name</FormLabel>
                  <Input
                    name="name"
                    value={editMenuItem.name}
                    onChange={handleInputChange}
                    isRequired
                  />
                  <FormErrorMessage>{formErrors.name}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!formErrors.price} mb="4">
                  <FormLabel>Price</FormLabel>
                  <Input
                    name="price"
                    type="number"
                    step="0.01"
                    value={editMenuItem.price}
                    onChange={handleInputChange}
                    isRequired
                  />
                  <FormErrorMessage>{formErrors.price}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!formErrors.description} mb="4">
                  <FormLabel>Description</FormLabel>
                  <Input
                    name="description"
                    value={editMenuItem.description}
                    onChange={handleInputChange}
                    isRequired
                  />
                  <FormErrorMessage>{formErrors.description}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!formErrors.subCategoryId} mb="4">
                  <FormLabel>Subcategory</FormLabel>
                  <Select
                    name="subCategoryId"
                    value={editMenuItem.subCategoryId}
                    onChange={handleSubCategoryChange}
                    placeholder="Select subcategory"
                    isRequired
                  >
                    {subCategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage>{formErrors.subCategoryId}</FormErrorMessage>
                </FormControl>
                <FormControl mb="4">
                  <FormLabel>Current Image</FormLabel>
                  {editMenuItem.currentImage ? (
                    <Image
                      src={editMenuItem.currentImage}
                      alt="Current Menu Item"
                      boxSize="100px"
                      objectFit="cover"
                      borderRadius="8px"
                      mb="2"
                    />
                  ) : (
                    <Text>No image available</Text>
                  )}
                </FormControl>
                <FormControl isInvalid={!!formErrors.image} mb="4">
                  <FormLabel>Upload New Image (Optional)</FormLabel>
                  <Input
                    type="file"
                    name="image"
                    accept="image/jpeg,image/png"
                    onChange={handleFileChange}
                  />
                  <FormErrorMessage>{formErrors.image}</FormErrorMessage>
                </FormControl>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleEditSubmit}
              isDisabled={!isFormValid}
            >
              Save
            </Button>
            <Button variant="ghost" onClick={onEditClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
}
