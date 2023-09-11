import { Button, Form, FormGroup, FormSelect, FormSelectOption, Modal, TextInput } from '@patternfly/react-core'
import React, { useState } from 'react'
import { Trigger, misfireInstructions, quartzService } from '../quartz-service'
import { log } from '../globals'

export const TriggersUpdateModal: React.FunctionComponent<{
  isOpen: boolean
  onClose: () => void
  mbean: string
  input: Trigger
}> = ({ isOpen, onClose, mbean, input }) => {
  const [trigger, setTrigger] = useState(input)

  const isCron = input.type === 'cron'
  const isSimple = input.type === 'simple'

  const updateTrigger = () => {
    log.info('Update trigger:', mbean, trigger)
    quartzService.updateTrigger(mbean, trigger)
    onClose()
  }

  const clear = () => {
    setTrigger(input)
    onClose()
  }

  const updateTriggerButtons = [
    <Button key='update' variant='primary' form='quartz-triggers-update-modal-form' onClick={updateTrigger}>
      Update
    </Button>,
    <Button key='cancel' variant='link' onClick={clear}>
      Cancel
    </Button>,
  ]

  return (
    <Modal
      id='quartz-triggers-update-modal'
      variant='medium'
      title={`Update Trigger: ${input.group}/${input.name}`}
      isOpen={isOpen}
      onClose={clear}
      actions={updateTriggerButtons}
    >
      <Form id='quartz-triggers-update-modal-form' isHorizontal>
        {isCron && (
          <FormGroup
            label='Cron expression'
            isRequired
            fieldId='quartz-triggers-update-modal-form-cron'
            helperText='Specify a cron expression for the trigger'
          >
            <TextInput
              id='quartz-triggers-update-modal-form-cron'
              name='quartz-triggers-update-modal-form-cron'
              isRequired
              value={trigger.expression}
              onChange={value => setTrigger({ ...trigger, expression: value })}
            />
          </FormGroup>
        )}
        {isSimple && (
          <React.Fragment>
            <FormGroup
              label='Repeat count'
              isRequired
              fieldId='quartz-triggers-update-modal-form-repeat-count'
              helperText='Number of times to repeat. Use -1 for forever'
            >
              <TextInput
                id='quartz-triggers-update-modal-form-repeat-count'
                name='quartz-triggers-update-modal-form-repeat-count'
                isRequired
                type='number'
                value={trigger.repeatCount}
                onChange={value => setTrigger({ ...trigger, repeatCount: parseInt(value) })}
              />
            </FormGroup>
            <FormGroup
              label='Repeat interval'
              isRequired
              fieldId='quartz-triggers-update-modal-form-repeat-interval'
              helperText='Elapsed time in millis between triggering'
            >
              <TextInput
                id='quartz-triggers-update-modal-form-repeat-interval'
                name='quartz-triggers-update-modal-form-repeat-interval'
                isRequired
                type='number'
                value={trigger.repeatInterval}
                onChange={value => setTrigger({ ...trigger, repeatInterval: parseInt(value) })}
              />
            </FormGroup>
          </React.Fragment>
        )}
        <FormGroup
          label='Misfire Instruction'
          isRequired
          fieldId='quartz-triggers-update-modal-form-misfire'
          helperText='What to do when misfiring happens'
        >
          <FormSelect
            id='quartz-triggers-update-modal-form-misfire-select'
            aria-label='Select Misfire Instruction'
            value={trigger.misfireInstruction}
            onChange={value => setTrigger({ ...trigger, misfireInstruction: parseInt(value) })}
          >
            {misfireInstructions.map(({ value, label }, index) => (
              <FormSelectOption key={index} value={value} label={label} />
            ))}
          </FormSelect>
        </FormGroup>
      </Form>
    </Modal>
  )
}
