class TenantAwareMixin:
    """
    Mixin for DRF views that automatically filters querysets by the
    authenticated user's madrasah (tenant).  Also scopes create/update
    so that new objects inherit the correct madrasah.

    Usage:
        class MyViewSet(TenantAwareMixin, ModelViewSet):
            queryset = MyModel.objects.all()
            ...
    """

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and hasattr(user, 'madrasah_id') and user.madrasah_id:
            return qs.filter(madrasah=user.madrasah)
        return qs.none()

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)

    def perform_update(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)
