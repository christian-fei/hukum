
const link = require('terminal-link')

const gh = require('./gh')
const git = require('./git')
const printer = require('./print')

const sleep = (ms = 1000) => new Promise((resolve) => {
  setTimeout(resolve, ms)
})

module.exports.start = async () => {
  try {
    const gitInfo = await git.getInfo()

    const repo = gh.getRepo(gitInfo.repo)

    const runs = await repo.getRuns(gitInfo.branch)

    const run = runs.find(async (run) => {
      return run.head_branch === gitInfo.branch && run.head_sha === gitInfo.hash
    })

    if (run) {
      console.log('  ', link(run.head_commit.message, run.html_url))

      while (true) {
        let jobsComplete = true

        const jobs = await repo.getJobs(run.id)

        jobs.map((job) => {
          jobsComplete = jobsComplete && job.status === 'completed'

          printer.printItem(job, '    ')

          job.steps.map((step) => {
            printer.printItem(step, '      ')
          })
        })

        if (jobsComplete) break

        await sleep()
      }
    } else console.log('\nRecent push didn\'t trigger a workflow')
  } catch (err) {
    console.error(err)
  }
}
