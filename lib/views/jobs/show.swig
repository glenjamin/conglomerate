{% extends '../layout.swig' %}

{% block content %}

<a class="btn btn-primary" href="javascript:history.back()">Back</a>

<h2>{{ job.id }}</h2>
<h3>{{ job.who }}</h3>

{% autoescape false %}
{{ job.body }}
{% endautoescape %}

{% endblock %}
