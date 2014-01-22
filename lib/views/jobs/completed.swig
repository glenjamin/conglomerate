{% extends '../layout.swig' %}

{% block content %}

<style type="text/css">
#template { display: none; }
</style>

<h2>Jobs</h2>

<table class="table table-striped">
  <tbody id="jobs">
    <tr>
      <th>When</th>
      <th>Who</th>
      <th>Job ID</th>
    </tr>

    <tr id="template">
      <td></td>
      <td></td>
      <td><a href="/jobs/"></td>
    </tr>

    {% for job in jobs %}

      <tr>
        <td>{{ job.when.format("h:mm:ss.SSS") }}</td>
        <td>{{ job.who }}</td>
        <td><a href="/jobs/{{ job.id }}">{{ job.id }}</a></td>
      </tr>

    {% endfor %}
  </tbody>
</table>

<script src="/primus/primus.js"></script>
<script type="text/javascript">
var jobTable = document.getElementById('jobs');
var template = document.getElementById('template');
var jobs = Primus.connect('{{ primus }}').channel('{{ channel }}');
var maxRows = {{ max_jobs }} + 2;
jobs.on('data', function(msg) {
  var row = template.cloneNode(true);
  row.removeAttribute('id');
  var cells = row.getElementsByTagName('td');
  cells[0].textContent = msg.when;
  cells[1].textContent = msg.who;
  var link = cells[2].getElementsByTagName('a')[0];
  link.href += msg.id;
  link.textContent = msg.id;
  if (template.nextSibling) {
    jobTable.insertBefore(row, template.nextSibling);
  } else {
    jobTable.appendChild(row);
  }

  var rows = jobTable.getElementsByTagName('tr');
  var l = rows.length;
  while(l > maxRows) {
    rows[l-1].parentNode.removeChild(rows[l-1]);
    l -= 1;
  }
});
</script>

{% endblock %}
