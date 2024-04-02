document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-details-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(id){

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

      console.log("View email: " + id);

      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#email-details-view').style.display = 'block';
      
      const body = document.querySelector('#email-details-view');
      body.innerHTML = `
        <ul class="list-group list-group-flush">
          <h6 class="list-group-item-light"><strong>From:</strong> ${email.sender} </h6>
          <h6 class="list-group-item-light"><strong>To:</strong> ${email.recipients} </h6>
          <h6 class="list-group-item-light"><strong>Subject:</strong> ${email.subject} </h6>
          <h6 class="list-group-item-light"><strong>Timestamp:</strong> ${email.timestamp} </h6>
          <button type="button" class="btn btn-primary btn-sm" id="btn_reply" style="width: 120px">Reply</button>
          <li class="list-group-item list-group-item-action" style="border-top: 5px">${email.body} </li>
        </ul>
      `
      if(!email.read){
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        })
      }

      btn_reply = document.querySelector('#btn_reply');
      btn_reply.addEventListener('click', button =>{
          compose_email();

          document.querySelector('#compose-recipients').value = email.sender;
          let subject_email = email.subject;
          if(subject_email.split(" ", 1)[0] != "Re:"){
            subject_email = "Re: " + email.subject;
          }
          document.querySelector('#compose-subject').value = subject_email;
          document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;   

      });

      if(email.user !== email.sender){
        const btn_archived = document.createElement('button');
        const archived = email.archived;
        btn_archived.innerHTML = archived ? "Unarchive" : "Archive";
        btn_archived.className = archived ? "btn btn-outline-danger" : "btn btn-outline-success";
        btn_archived.style = "margin-top:6px";

        btn_archived.addEventListener('click', function() {
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: !email.archived
            })
          })
          .then(() => { load_mailbox('inbox')})
        });
        document.querySelector('#email-details-view').append(btn_archived);
      }
      
  });
}

function send_email(event){

  event.preventDefault();

  const recipient = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipient,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(() => {
      load_mailbox('sent');
  });

  console.log("Sent with success.");
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-details-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);
  
      emails.forEach(email => {
        const element = document.createElement('div');
        element.className = "card border-primary mb-3 card-body text-dark";
        element.innerHTML = `
          <h6><strong>Send: </strong> ${email.sender}</h6>
          <h6><strong>Subject: </strong> ${email.subject}</h6>
          <p>${email.timestamp}</p>
        `;

        element.style = email.read ? 'background-color: rgb(193, 190, 190)' : 'background-color: white';

        element.addEventListener('click', function(){
          view_email(email.id);
        });
        document.querySelector('#emails-view').append(element);
      });
  });
}
