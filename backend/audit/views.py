from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only endpoint for querying the audit trail."""
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action', 'model_name', 'actor', 'object_id']
    search_fields = ['object_repr', 'reason', 'actor__first_name', 'actor__last_name']
    ordering_fields = ['created_at', 'action', 'model_name']

    def get_queryset(self):
        qs = AuditLog.objects.filter(
            madrasah=self.request.user.madrasah
        ).select_related('actor')

        # Date range filtering
        date_from = self.request.query_params.get('from')
        date_to = self.request.query_params.get('to')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        return qs
