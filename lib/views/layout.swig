<!DOCTYPE html>
<html>
  <head>
    <title>{{ title }}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Bootstrap -->
    <link href="/css/bootstrap.min.css" rel="stylesheet" media="screen">
    <link rel="stylesheet" href="/css/hljs-github.min.css">
    <script src="/js/hljs.min.js"></script>
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
