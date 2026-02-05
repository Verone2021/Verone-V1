# Patterns Async Obligatoires (TypeScript/React)

## Les 3 Erreurs Production Silencieuses

### 1. Promesses Flottantes (no-floating-promises)

```typescript
// ❌ INTERDIT - Si erreur = silence total
onClick={() => {
  createOrder(orderData);
}}

// ✅ OBLIGATOIRE - void + .catch()
onClick={() => {
  void createOrder(orderData).catch(error => {
    console.error('[Component] Order creation failed:', error);
    toast.error('Erreur lors de la creation');
  });
}}
```

### 2. Async dans Event Handlers (no-misused-promises)

```typescript
// ❌ INTERDIT - handleSubmit est async
<form onSubmit={handleSubmit}>

// ✅ OBLIGATOIRE - wrapper synchrone
<form onSubmit={(e) => {
  void handleSubmit(e).catch(error => {
    console.error('[Form] Submit failed:', error);
  });
}}>
```

### 3. React Query invalidateQueries sans await

```typescript
// ❌ INTERDIT - UI s'affiche AVANT invalidation cache = donnees obsoletes
const mutation = useMutation({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  },
});

// ✅ OBLIGATOIRE - await + onError
const mutation = useMutation({
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
    toast.success('Succes');
  },
  onError: error => {
    console.error('[Mutation]:', error);
    toast.error('Erreur');
  },
});
```
