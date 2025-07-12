from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class QuestionnaireConfig(AppConfig):
    name = "questionairre.questionnaire"
    verbose_name = _("Questionnaire")

    def ready(self):
        try:
            import questionairre.questionnaire.signals  # noqa F401
        except ImportError:
            pass 