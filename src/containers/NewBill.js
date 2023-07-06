import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    new Logout({ document, localStorage, onNavigate })
  }
  handleChangeFile = e => {
    e.preventDefault()
    if (e.target) {
      const file = this.document.querySelector(`input[data-testid="file"]`).files[0];
      if (e.target.files.length > 0) {
        if (e.target.files[0].type != 'image/jpeg' && e.target.files[0].type != 'image/png') {
          e.target.classList.add('is-invalid');
          console.log('le fichier doit être au format jpeg, jpg ou png.');
          this.document.querySelector(`input[data-testid="file"]`).value = '';
        } else {
          if (e.target.classList.contains('is-invalid')) {
            e.target.classList.remove('is-invalid');
          }
          const filePath = e.target.value.split(/\\/g)
          const fileName = filePath[filePath.length - 1]
          const formData = new FormData()
          const email = JSON.parse(localStorage.getItem("user")).email
          formData.append('file', file)
          formData.append('email', email)

          this.store
            .bills()
            .create({
              data: formData,
              headers: {
                noContentType: true
              }
            })
            .then(({ fileUrl, key }) => {
              console.log(fileUrl)
              this.billId = key
              this.fileUrl = fileUrl
              this.fileName = fileName
            }).catch(error => console.error(error))
        }
      }
    }
  }
  handleSubmit = e => {
    e.preventDefault()
    console.log('e.target.querySelector(`input[data-testid="datepicker"]`).value', e.target.querySelector(`input[data-testid="datepicker"]`).value)
    const email = JSON.parse(localStorage.getItem("user")).email
    if (!this.fileName && !this.fileUrl) {
      console.log('le fichier doit être renseigner.');
    } else {
      const bill = {
        email,
        type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
        name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
        amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
        date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
        vat: e.target.querySelector(`input[data-testid="vat"]`).value,
        pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
        commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
        fileUrl: this.fileUrl,
        fileName: this.fileName,
        status: 'pending'
      }
      this.updateBill(bill)
      this.onNavigate(ROUTES_PATH['Bills'])
    }
  }

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH['Bills'])
        })
        .catch(error => console.error(error))
    }
  }
}