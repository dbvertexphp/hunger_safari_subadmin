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
  FormControl,
  FormLabel,
  Input,
  useDisclosure,
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
  const [newSubCategory, setNewSubCategory] = React.useState({ name: '', image: null, restaurant_id: '680ccfbd7ab6ba4fb1b2f35b' });
  const [editSubCategory, setEditSubCategory] = React.useState({ id: '', name: '', image: null, restaurant_id: '' });
  const [selectedSubCategory, setSelectedSubCategory] = React.useState(null);
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const navigate = useNavigate();
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();

  // Fetch subcategories from API
  const baseUrl = process.env.REACT_APP_BASE_URL;
  const token = localStorage.getItem('token');

  React.useEffect(() => {
    const fetchSubCategories = async () => {
      try {
        if (!baseUrl || !token) {
          throw new Error('Missing base URL or authentication token');
        }
        const response = await axios.get(
          `${baseUrl}api/subCategory/getUnassignedSubCategories`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        console.log('API Response:', response.data);

        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Invalid response format: Expected an array of subcategories');
        }

        const formattedData = response.data.map((item) => ({
          id: item._id || '',
          name: item.name || 'Unknown',
          image: item.image ? `${baseUrl}${item.image}` : '',
          createdAt: item.createdAt || '',
          restaurant_id: item.restaurant_id || '',
          menuItems: item.menuItems || [],
        }));

        setData(formattedData);
        setLoading(false);
      } catch (err) {
        console.error('Fetch Error:', err);
        if (
          err.response?.data?.message === 'Not authorized, token failed' ||
          err.response?.data?.message === 'Session expired or logged in on another device' ||
          err.response?.data?.message ===
            'Un-Authorized, You are not authorized to access this route.' ||  'Not authorized, token failed'
        ) {
          localStorage.removeItem('token');
          navigate('/');
        } else {
          setError(err.message || 'Failed to fetch subcategories');
          setLoading(false);
        }
      }
    };

    fetchSubCategories();
  }, [navigate]);

  // Handle adding a new subcategory
  const handleAddSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append('name', newSubCategory.name);
      formData.append('restaurant_id', newSubCategory.restaurant_id);
      if (newSubCategory.image) {
        formData.append('image', newSubCategory.image);
      }

      const response = await axios.post(
        `${baseUrl}api/subCategory/add`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      setData([
        ...data,
        {
          id: response.data._id,
          name: response.data.name,
          image: response.data.image ? `${baseUrl}${response.data.image}` : '',
          createdAt: response.data.createdAt,
          restaurant_id: response.data.restaurant_id,
          menuItems: response.data.menuItems || [],
        },
      ]);
      setNewSubCategory({ name: '', image: null, restaurant_id: '680ccfbd7ab6ba4fb1b2f35b' });
      window.location.href = '/admin/subCategory';
      onAddClose();
    } catch (err) {
      console.error('Add Subcategory Error:', err);
      setError(err.message || 'Failed to add subcategory');
    }
  };

  // Handle updating a subcategory
  const handleEditSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append('name', editSubCategory.name);
      formData.append('restaurant_id', editSubCategory.restaurant_id);
      if (editSubCategory.image) {
        formData.append('image', editSubCategory.image);
      }

      const response = await axios.put(
        `${baseUrl}api/subCategory/update/${editSubCategory.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      setData(
        data.map((item) =>
          item.id === editSubCategory.id
            ? {
                ...item,
                name: response.data.name,
                image: response.data.image ? `${baseUrl}${response.data.image}` : item.image,
                restaurant_id: response.data.restaurant_id,
              }
            : item,
        ),
      );
      setEditSubCategory({ id: '', name: '', image: null, restaurant_id: '' });
      window.location.href = '/admin/subCategory';
      onEditClose();
    } catch (err) {
      console.error('Update Subcategory Error:', err);
      setError(err.message || 'Failed to update subcategory');
    }
  };

  // Handle deleting a subcategory
  const handleDeleteSubCategory = async (subCategoryId) => {
    try {
      await axios.delete(`${baseUrl}api/subCategory/delete/${subCategoryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setData(data.filter((item) => item.id !== subCategoryId));
      window.location.href = '/admin/subCategory';
    } catch (err) {
      console.error('Delete Subcategory Error:', err);
      setError(err.message || 'Failed to delete subcategory');
    }
  };

  // Handle deleting a menu item
  const handleDeleteMenuItem = async (subCategoryId, menuItemId) => {
    try {
      await axios.delete(`${baseUrl}api/menuItem/delete/${menuItemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setData(
        data.map((item) =>
          item.id === subCategoryId
            ? {
                ...item,
                menuItems: item.menuItems.filter((menuItem) => menuItem._id !== menuItemId),
              }
            : item
        )
      );
      setSelectedSubCategory({
        ...selectedSubCategory,
        menuItems: selectedSubCategory.menuItems.filter((menuItem) => menuItem._id !== menuItemId),
      });
    } catch (err) {
      console.error('Delete Menu Item Error:', err);
      setError(err.message || 'Failed to delete menu item');
    }
  };

  // Handle view details click
  const handleViewDetails = (subCategory) => {
    setSelectedSubCategory(subCategory);
    onDetailsOpen();
  };

  // Handle edit button click
  const handleEditClick = (subCategory) => {
    setEditSubCategory({
      id: subCategory.id,
      name: subCategory.name,
      image: subCategory.image,
      restaurant_id: subCategory.restaurant_id,
    });
    onEditOpen();
  };

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
              alt="Subcategory"
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
    columnHelper.accessor('createdAt', {
      id: 'createdAt',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          CreatedAt
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
            onClick={() => handleDeleteSubCategory(row.original.id)}
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
          Subcategories Table
        </Text>
        <Button colorScheme="blue" size="md" onClick={onAddOpen}>
          Add Subcategory
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

      {/* Add Subcategory Modal */}
      <Modal isOpen={isAddOpen} onClose={onAddClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Subcategory</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb="4">
              <FormLabel>Name</FormLabel>
              <Input
                value={newSubCategory.name}
                onChange={(e) =>
                  setNewSubCategory({ ...newSubCategory, name: e.target.value })
                }
                placeholder="Enter subcategory name"
              />
            </FormControl>
            <FormControl mb="4">
              <FormLabel>Image</FormLabel>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setNewSubCategory({ ...newSubCategory, image: e.target.files[0] })
                }
              />
            </FormControl>
            <Input
              type="hidden"
              value={newSubCategory.restaurant_id}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleAddSubmit}>
              Save
            </Button>
            <Button variant="ghost" onClick={onAddClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Subcategory Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Subcategory</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb="4">
              <FormLabel>Name</FormLabel>
              <Input
                value={editSubCategory.name}
                onChange={(e) =>
                  setEditSubCategory({ ...editSubCategory, name: e.target.value })
                }
                placeholder="Enter subcategory name"
              />
            </FormControl>
            <FormControl mb="4">
              <FormLabel>Image</FormLabel>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setEditSubCategory({ ...editSubCategory, image: e.target.files[0] })
                }
              />
            </FormControl>
            <img style={{width: "80px", height: "80px", marginTop: "15px"}} src={editSubCategory.image}/>
            <Input
              type="hidden"
              value={editSubCategory.restaurant_id}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleEditSubmit}>
              Update
            </Button>
            <Button variant="ghost" onClick={onEditClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={onDetailsClose}>
        <ModalOverlay />
        <ModalContent maxW="800px">
          <ModalHeader>Menu Items for {selectedSubCategory?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedSubCategory?.menuItems?.length > 0 ? (
              <Table variant="simple" color="gray.500">
                <Thead>
                  <Tr>
                    <Th>Image</Th>
                    <Th>Name</Th>
                    <Th>Price</Th>
                    <Th>Description</Th>
                    <Th>Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {selectedSubCategory.menuItems.map((item) => (
                    <Tr key={item._id}>
                      <Td>
                        {item.image ? (
                          <Image
                            src={`${baseUrl}${item.image}`}
                            alt={item.name}
                            boxSize="50px"
                            objectFit="cover"
                            borderRadius="8px"
                          />
                        ) : (
                          <Text>No Image</Text>
                        )}
                      </Td>
                      <Td>{item.name}</Td>
                      <Td>₹{item.price}</Td>
                      <Td>{item.description}</Td>
                      <Td>
                        <Button
                          colorScheme="red"
                          size="sm"
                          leftIcon={<DeleteIcon />}
                          onClick={() => handleDeleteMenuItem(selectedSubCategory.id, item._id)}
                        >
                          Delete
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <Text>No menu items available for this subcategory.</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleAddMenu}>
              Add Menu
            </Button>
            <Button variant="ghost" onClick={onDetailsClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
}
