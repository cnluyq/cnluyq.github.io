from django import forms
from .models import Problem

class ProblemForm(forms.ModelForm):
    class Meta:
        model = Problem
        fields = [
            'key_words', 'title', 'description',
            'root_cause', 'root_cause_file',
            'solutions', 'solutions_file',
            'others', 'others_file'
        ]
