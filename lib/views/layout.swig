<!DOCTYPE html>
<html>
  <head>
    <title>{{ title }}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Bootstrap -->
    <link href="/css/bootstrap.min.css" rel="stylesheet" media="screen">
    <link rel="stylesheet" href="http://yandex.st/highlightjs/8.0/styles/github.min.css">
    <script src="http://yandex.st/highlightjs/8.0/highlight.min.js"></script>
    <script>
      hljs.configure({languages: ['ruby', 'javascript']});
      hljs.initHighlightingOnLoad();
    </script>
  </head>
  <body>
    <div class="container">
        {% block content %}{% endblock %}
    </div>
  </body>
</html>
