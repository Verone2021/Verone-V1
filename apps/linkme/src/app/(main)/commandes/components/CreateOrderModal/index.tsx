'use client';

import type { CreateOrderModalProps } from './types';
import { useCreateOrder } from './use-create-order';
import { ExistingRestaurantForm } from './ExistingRestaurantForm';
import { NewRestaurantStepper } from './NewRestaurantStepper';
import { QuestionInitiale } from './QuestionInitiale';

export function CreateOrderModal({ isOpen, onClose }: CreateOrderModalProps) {
  const state = useCreateOrder(onClose);

  if (!isOpen) return null;

  const isLoading = state.affiliateLoading || state.selectionsLoading;

  // === QUESTION INITIALE ===
  if (state.isNewRestaurant === null) {
    return (
      <QuestionInitiale
        onExistingRestaurant={() => state.setIsNewRestaurant(false)}
        onNewRestaurant={() => state.setIsNewRestaurant(true)}
        onClose={state.handleClose}
      />
    );
  }

  // === RESTAURANT EXISTANT ===
  if (!state.isNewRestaurant) {
    return (
      <ExistingRestaurantForm
        isLoading={isLoading}
        selections={state.selections}
        selectedSelectionId={state.selectedSelectionId}
        handleSelectionChange={state.handleSelectionChange}
        selectedSelection={state.selectedSelection}
        customers={state.customers}
        customersLoading={state.customersLoading}
        selectedCustomerId={state.selectedCustomerId}
        handleCustomerSelect={state.handleCustomerSelect}
        setContactsComplete={state.setContactsComplete}
        setPendingContacts={state.setPendingContacts}
        products={state.products}
        productsLoading={state.productsLoading}
        productsError={state.productsError}
        paginatedProducts={state.paginatedProducts}
        filteredProducts={state.filteredProducts}
        categories={state.categories}
        totalPages={state.totalPages}
        currentPage={state.currentPage}
        setCurrentPage={state.setCurrentPage}
        searchQuery={state.searchQuery}
        setSearchQuery={state.setSearchQuery}
        selectedCategory={state.selectedCategory}
        setSelectedCategory={state.setSelectedCategory}
        cart={state.cart}
        cartTotals={state.cartTotals}
        notes={state.notes}
        setNotes={state.setNotes}
        canSubmitExisting={state.canSubmitExisting}
        _selectedCustomer={state._selectedCustomer}
        createOrderIsPending={state.createOrder.isPending}
        updateContactsIsPending={state.updateContacts.isPending}
        showConfirmExistingModal={state.showConfirmExistingModal}
        setShowConfirmExistingModal={state.setShowConfirmExistingModal}
        handleAddToCart={state.handleAddToCart}
        handleUpdateQuantity={state.handleUpdateQuantity}
        handleRemoveFromCart={state.handleRemoveFromCart}
        handleSubmitExisting={state.handleSubmitExisting}
        onBack={() => state.setIsNewRestaurant(null)}
        onClose={state.handleClose}
      />
    );
  }

  // === NOUVEAU RESTAURANT ===
  return (
    <NewRestaurantStepper
      newRestaurantStep={state.newRestaurantStep}
      setNewRestaurantStep={state.setNewRestaurantStep}
      newRestaurantForm={state.newRestaurantForm}
      setNewRestaurantForm={state.setNewRestaurantForm}
      showConfirmModal={state.showConfirmModal}
      setShowConfirmModal={state.setShowConfirmModal}
      canSubmitNew={state.canSubmitNew}
      cart={state.cart}
      cartTotals={state.cartTotals}
      notes={state.notes}
      setNotes={state.setNotes}
      requester={state.requester}
      selections={state.selections}
      selectedSelectionId={state.selectedSelectionId}
      handleSelectionChange={state.handleSelectionChange}
      products={state.products}
      productsLoading={state.productsLoading}
      paginatedProducts={state.paginatedProducts}
      filteredProducts={state.filteredProducts}
      categories={state.categories}
      totalPages={state.totalPages}
      currentPage={state.currentPage}
      setCurrentPage={state.setCurrentPage}
      searchQuery={state.searchQuery}
      setSearchQuery={state.setSearchQuery}
      selectedCategory={state.selectedCategory}
      setSelectedCategory={state.setSelectedCategory}
      handleAddToCart={state.handleAddToCart}
      handleUpdateQuantity={state.handleUpdateQuantity}
      createOrderIsPending={state.createOrder.isPending}
      selectedCustomerContacts={state.selectedCustomerContacts}
      onBack={() => state.setIsNewRestaurant(null)}
      onClose={state.handleClose}
      onSubmit={() => {
        void state.handleSubmitNew();
      }}
    />
  );
}
