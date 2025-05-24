import {
  Box,
  Flex,
  Text,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Button,
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
  Select,
  Image,
  Textarea,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import Card from 'components/card/Card';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { debounce } from 'lodash';

const FallbackComponent = ({ error }) => (
  <Box p={4}>
    <Alert status="error">
      <AlertIcon />
      Something went wrong: {error.message}
    </Alert>
  </Box>
);

const useFetchRestaurant = (baseUrl, token, restaurantId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!baseUrl || !token) {
          throw new Error('Missing API URL, authentication token, or restaurant ID');
        }
        const response = await axios.get(
          `${baseUrl}api/subadmin/getRestaurantByUserId`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        console.log('API Response:', response.data); // Debug API response
        if (!response.data) {
          throw new Error('Invalid API response: No restaurant found');
        }
        setData({
          id: response.data._id || '',
          name: response.data.name || 'N/A',
          category: response.data.category_id?.name || 'N/A',
          category_id: response.data.category_id?._id || '',
          address: response.data.address || 'N/A',
          opening_time: response.data.opening_time || 'N/A',
          closing_time: response.data.closing_time || 'N/A',
          tax_rate: response.data.tax_rate || 0,
          rating: response.data.rating || 0,
          createdAt: response.data.createdAt || 'N/A',
          latitude: response.data.location?.coordinates?.[0] || 0,
          longitude: response.data.location?.coordinates?.[1] || 0,
          image: response.data.image || '',
          subAdminName: response.data.subAdminName || 'N/A',
          subcategoryCount: response.data.subcategories?.length || 0,
          subcategories:
            response.data.subcategories?.map((sub) => ({
              _id: sub._id,
              name: sub.name,
              image: sub.image,
              menuItems:
                sub.menuItems?.map((item) => ({
                  _id: item._id,
                  name: item.name,
                  price: item.price,
                  description: item.description,
                  image: item.image,
                })) || [],
            })) || [],
        });
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          'Failed to load restaurant';
        if (errorMessage.includes('Session expired') || errorMessage.includes('Un-Authorized')) {
          localStorage.removeItem('token');
          setRedirect(true);
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [baseUrl, token, restaurantId]);

  return { data, loading, error, setData, redirect };
};

const useFetchCategories = (baseUrl, token) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!baseUrl || !token) {
          throw new Error('Missing API URL or authentication token');
        }
        const response = await axios.get(
          `${baseUrl}api/categories/getAllCategories`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!response.data) {
          throw new Error('Invalid API response: No categories found');
        }
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError(error.response?.data?.message || 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [baseUrl, token]);

  return { categories, loading, error };
};

function Restaurant() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const baseUrl = useMemo(() => process.env.REACT_APP_BASE_URL, []);
  const token = localStorage.getItem('token');

  const { data, loading, error, setData, redirect } = useFetchRestaurant(
    baseUrl,
    token,
    restaurantId,
  );
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useFetchCategories(baseUrl, token);

  useEffect(() => {
    if (redirect) {
      navigate('/');
    }
  }, [redirect, navigate]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    category_id: '',
    details: '',
    opening_time: '',
    closing_time: '',
    tax_rate: '',
    rating: '',
    latitude: '',
    longitude: '',
    image: null,
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  const debouncedHandleEditClick = debounce((restaurant, setSelectedRestaurant, setFormData, setImagePreview, setIsEditModalOpen, setFormError) => {
    try {
      if (!restaurant || !restaurant.id) {
        console.error('Invalid restaurant data:', restaurant);
        setFormError('Cannot edit: Invalid restaurant data');
        return;
      }
      setSelectedRestaurant(restaurant);
      setFormData({
        name: restaurant.name || '',
        address: restaurant.address || '',
        category_id: restaurant.category_id || '',
        details: restaurant.details || '',
        opening_time: restaurant.opening_time || '',
        closing_time: restaurant.closing_time || '',
        tax_rate: restaurant.tax_rate || '',
        rating: restaurant.rating || '',
        latitude: restaurant.latitude || '',
        longitude: restaurant.longitude || '',
        image: null,
      });
      setImagePreview(restaurant.image || '');
      setIsEditModalOpen(true);
    } catch (error) {
      console.error('Error in handleEditClick:', error);
      setFormError('Failed to open edit modal');
    }
  }, 300);

  const handleEditClick = useCallback(
    (restaurant) => {
      debouncedHandleEditClick(restaurant, setSelectedRestaurant, setFormData, setImagePreview, setIsEditModalOpen, setFormError);
    },
    [setSelectedRestaurant, setFormData, setImagePreview, setIsEditModalOpen, setFormError, debouncedHandleEditClick]
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Restaurant name is required.';
    if (!formData.address.trim()) return 'Address is required.';
    if (!formData.category_id) return 'Category is required.';
    if (!formData.tax_rate) return 'Tax rate is required.';
    if (!formData.rating) return 'Rating is required.';
    if (!formData.opening_time) return 'Opening time is required.';
    if (!formData.closing_time) return 'Closing time is required.';

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.opening_time))
      return 'Invalid opening time format (HH:MM).';
    if (!timeRegex.test(formData.closing_time))
      return 'Invalid closing time format (HH:MM).';

    const taxRateRegex = /^\d+(\.\d{1,2})?$/;
    if (!taxRateRegex.test(formData.tax_rate))
      return 'Invalid tax rate (e.g., 10 or 10.5).';

    const rating = parseFloat(formData.rating);
    if (isNaN(rating) || rating < 0 || rating > 5)
      return 'Rating must be between 0 and 5.';

    const lat = parseFloat(formData.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90)
      return 'Latitude must be between -90 and 90.';

    const lon = parseFloat(formData.longitude);
    if (isNaN(lon) || lon < -180 || lon > 180)
      return 'Longitude must be between -180 and 180.';

    return '';
  };

  const handleUpdateRestaurant = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('category_id', formData.category_id);
      formDataToSend.append('details', formData.details);
      formDataToSend.append('opening_time', formData.opening_time);
      formDataToSend.append('closing_time', formData.closing_time);
      formDataToSend.append('tax_rate', parseFloat(formData.tax_rate));
      formDataToSend.append('rating', parseFloat(formData.rating));
      formDataToSend.append('latitude', parseFloat(formData.latitude));
      formDataToSend.append('longitude', parseFloat(formData.longitude));
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const response = await axios.put(
        `${baseUrl}api/resturant/update/${selectedRestaurant.id}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.data.message === 'Restaurant updated successfully') {
        const category = categories.find((c) => c._id === formData.category_id);
        setData({
          ...data,
          name: formData.name,
          address: formData.address,
          category_id: formData.category_id,
          category: category?.name || 'N/A',
          details: formData.details,
          opening_time: formData.opening_time,
          closing_time: formData.closing_time,
          tax_rate: parseFloat(formData.tax_rate),
          rating: parseFloat(formData.rating),
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          image: formData.image
            ? URL.createObjectURL(formData.image)
            : data.image,
        });
        setIsEditModalOpen(false);
        setFormError('');
        setImagePreview('');
      } else {
        setFormError(response.data.message || 'Failed to update restaurant.');
      }
    } catch (error) {
      console.error('Error updating restaurant:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to update restaurant.';
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedRestaurant(null);
    setFormData({
      name: '',
      address: '',
      category_id: '',
      details: '',
      opening_time: '',
      closing_time: '',
      tax_rate: '',
      rating: '',
      latitude: '',
      longitude: '',
      image: null,
    });
    setFormError('');
    setImagePreview('');
  };

  if (loading || categoriesLoading) {
    return (
      <Box
        pt={{ base: '130px', md: '80px', xl: '80px' }}
        textAlign="center"
        py={10}
      >
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error || categoriesError) {
    return (
      <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error || categoriesError}
        </Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
        <Alert status="warning" mb={4}>
          <AlertIcon />
          No restaurant found.
        </Alert>
      </Box>
    );
  }

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <Card flexDirection="column" w="100%" px="25px" py="20px">
        <Flex justifyContent="space-between" align="center" mb="20px">
          <Text
            color={textColor}
            fontSize="22px"
            fontWeight="700"
            lineHeight="100%"
          >
            Restaurant Details
          </Text>
          <Button
            colorScheme="blue"
            size="md"
            leftIcon={<EditIcon />}
            onClick={() => handleEditClick(data)}
          >
            Edit
          </Button>
        </Flex>
        <Table variant="simple" colorScheme="gray">
          <Thead>
            <Tr>
              <Th>Image</Th>
              <Th>Name</Th>
              <Th>Category</Th>
              <Th>Sub-Admin</Th>
              <Th>Rating</Th>
              <Th>Tax Rate</Th>
              <Th>Subcategories</Th>
              <Th>Time</Th>
              <Th>Address</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td>
                {data.image ? (
                  <Image
                    src={data.image}
                    alt={data.name}
                    maxW="50px"
                    borderRadius="4px"
                    objectFit="cover"
                    fallbackSrc="https://via.placeholder.com/50?text=No+Image"
                  />
                ) : (
                  'N/A'
                )}
              </Td>
              <Td>{data.name}</Td>
              <Td>{data.category}</Td>
              <Td>{data.subAdminName}</Td>
              <Td>{data.rating}</Td>
              <Td>{data.tax_rate}%</Td>
              <Td>{data.subcategoryCount}</Td>
              <Td>
                ({data.opening_time}-{data.closing_time})
              </Td>
              <Td>{data.address || 'N/A'}</Td>
            </Tr>
          </Tbody>
        </Table>
        {data.subcategories?.length > 0 && (
          <Box mt={6}>
            <Text fontSize="lg" fontWeight="bold" mb={4}>
              Subcategories
            </Text>
            {data.subcategories.map((subcategory) => (
              <Card key={subcategory._id} mb={6} p={4}>
                <Flex alignItems="center" mb={4}>
                  <Text fontSize="md" fontWeight="bold" mr={2}>
                    {subcategory.name}
                  </Text>
                  {subcategory.image && (
                    <Image
                      src={subcategory.image}
                      alt={subcategory.name}
                      maxW={{ base: '50px', md: '75px' }}
                      borderRadius="4px"
                      objectFit="cover"
                      fallbackSrc="https://via.placeholder.com/75?text=No+Image"
                    />
                  )}
                </Flex>
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  MenuItems
                </Text>
                {subcategory.menuItems?.length > 0 ? (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Image</Th>
                        <Th>Name</Th>
                        <Th>Price</Th>
                        <Th>Description</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {subcategory.menuItems.map((item) => (
                        <Tr key={item._id}>
                          <Td>
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                maxW="50px"
                                borderRadius="4px"
                                objectFit="cover"
                                fallbackSrc="https://via.placeholder.com/50?text=No+Image"
                              />
                            ) : (
                              'N/A'
                            )}
                          </Td>
                          <Td>{item.name}</Td>
                          <Td>₹{item.price}</Td>
                          <Td>{item.description || 'N/A'}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                ) : (
                  <Text fontSize="sm">No menu items available.</Text>
                )}
              </Card>
            ))}
          </Box>
        )}
      </Card>

      {/* Edit Restaurant Modal */}
      <Modal isOpen={isEditModalOpen} onClose={onModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Restaurant</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {formError && (
              <Alert status="error" mb={4}>
                <AlertIcon />
                {formError}
              </Alert>
            )}
            <FormControl mb={4} isRequired>
              <FormLabel>Name</FormLabel>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter restaurant name"
              />
            </FormControl>
            <FormControl mb={4} isRequired>
              <FormLabel>Address</FormLabel>
              <Input
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter address"
              />
            </FormControl>
            <FormControl mb={4} isRequired>
              <FormLabel>Category</FormLabel>
              <Select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                placeholder="Select category"
              >
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Details</FormLabel>
              <Textarea
                name="details"
                value={formData.details}
                onChange={handleInputChange}
                placeholder="Enter restaurant details"
              />
            </FormControl>
            <FormControl mb={4} isRequired>
              <FormLabel>Opening Time (HH:MM)</FormLabel>
              <Input
                name="opening_time"
                value={formData.opening_time}
                onChange={handleInputChange}
                placeholder="e.g., 09:00"
              />
            </FormControl>
            <FormControl mb={4} isRequired>
              <FormLabel>Closing Time (HH:MM)</FormLabel>
              <Input
                name="closing_time"
                value={formData.closing_time}
                onChange={handleInputChange}
                placeholder="e.g., 07:00"
              />
            </FormControl>
            <FormControl mb={4} isRequired>
              <FormLabel>Tax Rate (%)</FormLabel>
              <Input
                name="tax_rate"
                type="number"
                step="0.01"
                value={formData.tax_rate}
                onChange={handleInputChange}
                placeholder="Enter tax rate"
              />
            </FormControl>
            <FormControl mb={4} isRequired>
              <FormLabel>Rating (0-5)</FormLabel>
              <Input
                name="rating"
                type="number"
                step="0.1"
                value={formData.rating}
                onChange={handleInputChange}
                placeholder="Enter rating"
              />
            </FormControl>
            <FormControl mb={4} isRequired>
              <FormLabel>Latitude</FormLabel>
              <Input
                name="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={handleInputChange}
                placeholder="Enter latitude"
              />
            </FormControl>
            <FormControl mb={4} isRequired>
              <FormLabel>Longitude</FormLabel>
              <Input
                name="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={handleInputChange}
                placeholder="Enter longitude"
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Restaurant Image</FormLabel>
              {imagePreview && (
                <Image
                  src={imagePreview}
                  alt="Restaurant Preview"
                  maxW="150px"
                  mb={2}
                  borderRadius="8px"
                  objectFit="cover"
                />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                p={1}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleUpdateRestaurant}
              isLoading={isSubmitting}
            >
              Save
            </Button>
            <Button
              variant="ghost"
              onClick={onModalClose}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Restaurant Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRestaurant ? (
              <Box>
                <Flex flexDirection="column" alignItems="center" mb={4}>
                  <Text fontSize="lg" fontWeight="bold" mr={2}>
                    {selectedRestaurant.name}
                  </Text>
                  {selectedRestaurant.image && (
                    <Image
                      src={selectedRestaurant.image}
                      alt={selectedRestaurant.name}
                      maxW="100px"
                      borderRadius="8px"
                      objectFit="cover"
                      fallbackSrc="https://via.placeholder.com/100?text=No+Image"
                    />
                  )}
                  <Text fontSize="sm" mb={2}>
                    <strong>Opening Time:</strong>{' '}
                    {selectedRestaurant.opening_time || 'N/A'}
                  </Text>
                  <Text fontSize="sm" mb={2}>
                    <strong>Closing Time:</strong>{' '}
                    {selectedRestaurant.closing_time || 'N/A'}
                  </Text>
                  <Text fontSize="sm" mb={2}>
                    <strong>Address:</strong>{' '}
                    {selectedRestaurant.address || 'N/A'}
                  </Text>
                  <Text fontSize="sm" mb={2}>
                    <strong>Coordinates:</strong> ({selectedRestaurant.latitude}
                    , {selectedRestaurant.longitude})
                  </Text>
                </Flex>
                <Text fontSize="sm" mb={2}>
                  <strong>Subcategories:</strong>
                </Text>
                {selectedRestaurant.subcategories?.length > 0 ? (
                  selectedRestaurant.subcategories.map((subcategory) => (
                    <Box key={subcategory._id} mb={6}>
                      <Flex alignItems="center" mb={2}>
                        <Text fontSize="md" fontWeight="bold">
                          {subcategory.name}
                        </Text>
                      </Flex>
                      {subcategory.image && (
                        <Box mb={2}>
                          <Image
                            src={subcategory.image}
                            alt={subcategory.name}
                            maxW={{ base: '100px', md: '150px' }}
                            borderRadius="8px"
                            objectFit="cover"
                            fallbackSrc="https://via.placeholder.com/150?text=No+Image"
                          />
                        </Box>
                      )}
                      <Text fontSize="sm" fontWeight="bold" mb={2}>
                        Menu Items:
                      </Text>
                      {subcategory.menuItems?.length > 0 ? (
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Name</Th>
                              <Th>Price</Th>
                              <Th>Description</Th>
                              <Th>Image</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {subcategory.menuItems.map((item) => (
                              <Tr key={item._id}>
                                <Td>{item.name}</Td>
                                <Td>₹{item.price}</Td>
                                <Td>{item.description}</Td>
                                <Td>
                                  {item.image && (
                                    <Image
                                      src={item.image}
                                      alt={item.name}
                                      maxW="50px"
                                      borderRadius="4px"
                                      objectFit="cover"
                                      fallbackSrc="https://via.placeholder.com/50?text=No+Image"
                                    />
                                  )}
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      ) : (
                        <Text fontSize="sm">No menu items available.</Text>
                      )}
                    </Box>
                  ))
                ) : (
                  <Text>No subcategories available.</Text>
                )}
              </Box>
            ) : (
              <Spinner />
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => setIsDetailsModalOpen(false)}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default function RestaurantWrapper() {
  return (
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <Restaurant />
    </ErrorBoundary>
  );
}
