import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, authenticate
from django.contrib.auth.forms import UserCreationForm
from django.http import JsonResponse, HttpResponse
from .models import Problem
from .forms import ProblemForm
from django.db.models import Q 
from django.core.serializers.json import DjangoJSONEncoder

# ---------- 游客可见 ----------
#def problem_list(request):
#    query = request.GET.get('q')
#    if query:
#        problems = Problem.objects.filter(
#            key_words__icontains=query
#        ) | Problem.objects.filter(
#            title__icontains=query
#        ) | Problem.objects.filter(
#            description__icontains=query
#        )
#    else:
#        problems = Problem.objects.all()
#    return render(request, 'problems/problem_list.html', {'problems': problems, 'query': query})

def problem_list(request):
    query = request.GET.get('q','')
    problems = Problem.objects.all()

    if query:
        problems = problems.filter(
            Q(key_words__icontains=query) |
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(root_cause__icontains=query) |
            Q(solutions__icontains=query) |
            Q(others__icontains=query)
        )

    return render(request, 'problems/problem_list.html',
                  {'problems': problems, 'query': query})
# ---------- 登录/注册 ----------
def register_view(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('problem_list')
    else:
        form = UserCreationForm()
    return render(request, 'problems/register.html', {'form': form})

def login_view(request):
    from django.contrib.auth.views import LoginView
    return LoginView.as_view(template_name='problems/login.html')(request)

# ---------- 需登录 ----------
@login_required
def problem_add(request):
    if request.method == 'POST':
        form = ProblemForm(request.POST, request.FILES)
        if form.is_valid():
            obj = form.save(commit=False)
            obj.created_by = request.user
            obj.save()
            return redirect('problem_list')
    else:
        form = ProblemForm()
    return render(request, 'problems/problem_form.html', {'form': form, 'action': 'Add'})

@login_required
def problem_edit(request, pk):
    problem = get_object_or_404(Problem, pk=pk)
    if request.method == 'POST':
        form = ProblemForm(request.POST, request.FILES, instance=problem)
        if form.is_valid():
            form.save()
            return redirect('problem_list')
    else:
        form = ProblemForm(instance=problem)
    return render(request, 'problems/problem_form.html', {'form': form, 'action': 'Edit'})

@login_required
def problem_delete(request, pk):
    problem = get_object_or_404(Problem, pk=pk)
    problem.delete()
    return redirect('problem_list')

# ---------- 导入/导出 ----------
#@login_required
#def export_json(request):
#    data = list(Problem.objects.all().values(
#        'id', 'key_words', 'title', 'description',
#        'root_cause', 'solutions', 'others',
#       'create_time', 'update_time'
#    ))
#    response = HttpResponse(json.dumps(data, ensure_ascii=False, indent=2),
#                            content_type='application/json')
#    response['Content-Disposition'] = 'attachment; filename="problems.json"'
#    return response

@login_required
def export_json(request):
    data = list(
        Problem.objects.all().values(
            'id', 'key_words', 'title', 'description',
            'root_cause', 'solutions', 'others',
            'create_time', 'update_time'
        )
    )
    response = HttpResponse(
        json.dumps(data, cls=DjangoJSONEncoder, ensure_ascii=False, indent=2),
        content_type='application/json'
    )
    response['Content-Disposition'] = 'attachment; filename="problems.json"'
    return response

#@login_required
#def import_json(request):
#    if request.method == 'POST' and request.FILES.get('file'):
#        file = request.FILES['file']
#        try:
#            data = json.load(file)
#            for item in data:
#                item.pop('id', None)  # 避免主键冲突
#                Problem.objects.create(created_by=request.user, **item)
#            return JsonResponse({'status': 'success'})
#        except Exception as e:
#            return JsonResponse({'status': 'error', 'message': str(e)})
#    return JsonResponse({'status': 'invalid'})

@login_required
def import_json(request):
    if request.method == 'POST' and request.FILES.get('file'):
        file = request.FILES['file']
        try:
            data = json.load(file)
            for item in data:
                item.pop('id', None)  # 防止主键冲突
                Problem.objects.create(created_by=request.user, **item)
            # 上传成功后直接跳转回列表页
            return redirect('problem_list')
        except Exception as e:
            # 出错时仍然返回 JSON，方便调试
            return JsonResponse({'status': 'error', 'message': str(e)})
    # GET 请求禁止访问
    return redirect('problem_list')


from django.contrib.auth import logout

def logout_view(request):
    logout(request)
    return redirect('problem_list')
