{% extends '../layout.swig' %}

{% block content %}
<style type="text/css">
#template { display: none; }
</style>

<h2>Chat</h2>

<table class="table table-striped">

  <tbody id="messages">

    <tr>
      <th>When</th>
      <th>Room</th>
      <th>From</th>
      <th style="width: 100%">Message</th>
    </tr>

    <tr id="template">
      <td></td>
      <td></td>
      <td></td>
      <td></td>
    </td>

    {% for message in messages %}

      <tr>
        <td>{{ message.when.format("h:mm:ss.SSS") }}</td>
        <td>{{ message.room }}</td>
        <td>{{ message.name }}</td>
        <td>{{ message.message }}</td>
      </tr>

    {% endfor %}

  </tbody>

</table>

<script src="/primus/primus.js"></script>
<script type="text/javascript">
var messageTable = document.getElementById('messages');
var template = document.getElementById('template');
var chat = Primus.connect('{{ primus }}').channel('{{ channel }}');
var maxRows = {{ max_messages }} + 2;
chat.on('data', function(msg) {
  var row = template.cloneNode(true);
  row.removeAttribute('id');
  var cells = row.getElementsByTagName('td');
  cells[0].textContent = msg.when;
  cells[1].textContent = msg.room;
  cells[2].textContent = msg.name;
  cells[3].textContent = msg.message;
  if (template.nextSibling) {
    messageTable.insertBefore(row, template.nextSibling);
  } else {
    messageTable.appendChild(row);
  }

  var rows = messageTable.getElementsByTagName('tr');
  var l = rows.length;
  while(l > maxRows) {
    rows[l-1].parentNode.removeChild(rows[l-1]);
    l -= 1;
  }
});
</script>

{% endblock %}
