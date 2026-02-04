export const useGetError = (field: any): string => {
    if (!field?.$dirty || !field?.$error) return '';
    return field.$errors[0]?.$message ?? 'Invalid value.';
};