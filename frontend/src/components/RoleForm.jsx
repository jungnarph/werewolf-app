const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);
  setError('');

  try {
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('team', formData.team);
    data.append('score', formData.score);
    
    if (imageFile) {
      data.append('image', imageFile);
    }

    if (role) {
      await api.put(`/roles/${role.id}`, data);
    } else {
      await api.post('/roles', data);
    }

    // Show success message before closing
    if (window.showToast) {
      window.showToast('success', role ? 'Role updated successfully!' : 'Role created successfully!');
    }
    
    onSuccess();
  } catch (err) {
    setError(err.response?.data?.error || 'Failed to save role');
  } finally {
    setSubmitting(false);
  }
};