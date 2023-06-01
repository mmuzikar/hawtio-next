import React, { useContext, useEffect, useState } from 'react'
import { CamelContext } from '@hawtiosrc/plugins/camel/context'
import {
  Bullseye,
  Button,
  CodeBlock,
  CodeBlockCode,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Flex,
  FlexItem,
  FormGroup,
  Modal,
  ModalVariant,
  NumberInput,
  PageSection,
  Pagination,
  SearchInput,
  TextInput,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core'
import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import { SearchIcon } from '@patternfly/react-icons'
import {
  getMessagesFromTheEndpoint,
  MessageData,
  forwardMessagesToEndpoint,
} from '@hawtiosrc/plugins/camel/endpoints/endpoints-service'
import { eventService, NotificationType } from '@hawtiosrc/core'
import { Position } from 'reactflow'

const ForwardMessagesComponent: React.FunctionComponent<{
  onForwardMessages: (uri: string, message?: MessageData) => void
  currentMessage?: MessageData
}> = ({ onForwardMessages, currentMessage }) => {
  const [uri, setUri] = useState('')
  return (
    <FormGroup label='URI:'>
      <Flex>
        <FlexItem flex={{ default: 'flexNone', md: 'flex_3' }}>
          <TextInput id='forward-input' label='URI:' onChange={setUri} value={uri} />
        </FlexItem>
        <FlexItem flex={{ default: 'flexNone', md: 'flex_1' }}>
          <Button key='confirm' variant='primary' onClick={() => onForwardMessages(uri, currentMessage)}>
            Forward
          </Button>
        </FlexItem>
      </Flex>
    </FormGroup>
  )
}

const ForwardMessagesModal: React.FunctionComponent<{
  onForwardMessages: (uri: string, message?: MessageData) => void
  enabled: boolean
}> = ({ onForwardMessages, enabled }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleModalToggle = () => {
    setIsModalOpen(prevIsModalOpen => !prevIsModalOpen)
  }

  return (
    <>
      <Button isDisabled={!enabled} onClick={handleModalToggle}>
        Forward
      </Button>
      <Modal
        bodyAriaLabel='Message details'
        position={Position.Top}
        tabIndex={0}
        variant={ModalVariant.small}
        title={'Forward Messages'}
        isOpen={isModalOpen}
        onClose={handleModalToggle}
      >
        <ForwardMessagesComponent onForwardMessages={onForwardMessages} />
      </Modal>
    </>
  )
}
const MessageDetails: React.FunctionComponent<{
  message: MessageData
  mid: string
  index: number
  maxValue: number
  getMessage: (index: number) => MessageData
  forwardMessages: (uri: string, message?: MessageData) => void
}> = ({ message, mid, index, maxValue, getMessage, forwardMessages }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentMessage, setCurrentMessage] = useState<MessageData>(message)
  const [currentIndex, setCurrentIndex] = useState<number>(index)

  const handleModalToggle = () => {
    setIsModalOpen(prevIsModalOpen => !prevIsModalOpen)
    setCurrentMessage(message)
    setCurrentIndex(index)
  }

  const switchToMessage = (index: number) => {
    const message = getMessage(index)
    setCurrentMessage(message)
    setCurrentIndex(index)
  }

  return (
    <>
      <Button variant='link' onClick={handleModalToggle}>
        {mid}
      </Button>
      <Modal
        bodyAriaLabel='Message details'
        tabIndex={0}
        position={Position.Top}
        variant={ModalVariant.large}
        title={'Message Details'}
        isOpen={isModalOpen}
        onClose={handleModalToggle}
      >
        <br />
        <NumberInput
          value={currentIndex + 1}
          min={1}
          max={maxValue}
          onMinus={() => switchToMessage(currentIndex - 1)}
          onPlus={() => switchToMessage(currentIndex + 1)}
          inputName='input'
          inputAriaLabel='number input'
          minusBtnAriaLabel='minus'
          plusBtnAriaLabel='plus'
        />{' '}
        of {maxValue}
        <br />
        <ForwardMessagesComponent currentMessage={currentMessage} onForwardMessages={forwardMessages} />
        <FormGroup label='ID' frameBorder={1}>
          {currentMessage.messageId}
        </FormGroup>
        <br />
        <FormGroup label='Body'>
          <CodeBlock>
            <CodeBlockCode>{currentMessage.body}</CodeBlockCode>
          </CodeBlock>
        </FormGroup>
        <br />
        <FormGroup label='Headers'>
          <TableComposable variant='compact'>
            <Thead>
              <Tr>
                <Td label='Key'>Key</Td>
                <Td label='Type'>Type</Td>
                <Td label='Value'>Value</Td>
              </Tr>
            </Thead>
            <Tbody>
              {currentMessage.headers.map((header, index) => {
                return (
                  <Tr key={index + 'row'}>
                    <Td>{header.key}</Td>
                    <Td>{header.type}</Td>
                    <Td>{header.value}</Td>
                  </Tr>
                )
              })}
            </Tbody>
          </TableComposable>
        </FormGroup>
      </Modal>
    </>
  )
}

export const BrowseMessages: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const [messages, setMessages] = useState<MessageData[]>([])
  const [filteredMessages, setFilteredMessages] = useState<MessageData[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [filters, setFilters] = useState<string[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  useEffect(() => {
    const initLoad = async () => {
      if (selectedNode) {
        const messages = await getMessagesFromTheEndpoint(selectedNode, 0, -1)
        updateMessages(messages)
      }
    }
    initLoad()
  }, [selectedNode])

  async function loadMessages() {
    if (selectedNode) {
      const messages = await getMessagesFromTheEndpoint(selectedNode, 0, -1)
      updateMessages(messages)
    }
  }
  function updateMessages(messages: MessageData[]) {
    const data = messages.reverse()
    setMessages(data)
    setFilteredMessages(data)
    setSelected([])
    setFilters([])
  }

  const handleSearch = (value: string, filters: string[]) => {
    setSearchTerm(value)
    //filter with findTerm
    let filtered: MessageData[] = []
    if (value === '') {
      filtered = [...messages]
    } else {
      filtered = messages.filter(
        message => message.messageId.toLowerCase().includes(value.toLowerCase()) || message.body.includes(value),
      )
    }

    //filter with the rest of the filters
    filters.forEach(value => {
      filtered = filtered.filter(
        message => message.messageId.toLowerCase().includes(value.toLowerCase()) || message.body.includes(value),
      )
    })
    setSearchTerm(value)
    setPage(1)
    setFilteredMessages([...filtered])
  }

  const addToFilters = () => {
    setFilters([...filters, searchTerm])
    setSearchTerm('')
  }

  const getFromIndex = (): number => {
    return (page - 1) * perPage
  }

  const getToIndex = (): number => {
    return getFromIndex() + perPage
  }

  const getPage = () => {
    return filteredMessages.slice(getFromIndex(), getToIndex())
  }

  const handleNextMessage = (index: number): MessageData => {
    return filteredMessages[index]
  }

  const getSubstring = (body: string): string => {
    let res = body.substring(0, 100)
    if (body.length > 100) {
      res += '...'
    }
    return res
  }

  const onSelect = (messageId: string, isSelecting: boolean) => {
    const selectedRoutes = selected.filter(m => messageId !== m)
    setSelected(isSelecting ? [...selectedRoutes, messageId] : [...selectedRoutes])
  }

  const onSelectAll = (isSelected: boolean) => {
    const selected = filteredMessages.map(m => m.messageId)
    setSelected(isSelected ? selected : [])
  }
  const clearFilters = () => {
    setFilters([])
    setSearchTerm('')
    setFilteredMessages([...messages])
  }

  const onDeleteFilter = (filter: string) => {
    const newFilters = filters.filter(f => f !== filter)
    setFilters(newFilters)
    handleSearch(searchTerm, newFilters)
  }
  const isAllSelected = (): boolean => {
    //  let res = true
    for (const m of filteredMessages) {
      if (!selected.includes(m.messageId)) {
        return false
      }
    }
    return true
  }

  const createNotification = (type: NotificationType, message: string) => {
    eventService.notify({
      type: type,
      message: message,
    })
  }
  const forwardMessages = async (uri: string, message?: MessageData) => {
    if (selectedNode) {
      let selectedMessages: MessageData[] = []
      if (message) {
        selectedMessages.push(message)
      } else {
        selectedMessages = messages.filter(m => selected.includes(m.messageId))
      }
      await forwardMessagesToEndpoint(selectedNode, uri, selectedMessages, createNotification)
    }
  }

  const MessagesPagination = () => {
    return (
      <Pagination
        itemCount={filteredMessages.length}
        page={page}
        perPage={perPage}
        onSetPage={(_evt, value) => {
          setPage(value)
        }}
        onPerPageSelect={(_evt, value) => setPerPage(value)}
        variant='top'
      />
    )
  }
  return (
    <PageSection variant='light'>
      <Title headingLevel='h1'>Browse Messages</Title>

      <Toolbar clearAllFilters={clearFilters}>
        <ToolbarContent>
          <ToolbarGroup>
            <ToolbarFilter
              chips={filters}
              deleteChip={(_e, filter) => onDeleteFilter(filter as string)}
              deleteChipGroup={clearFilters}
              categoryName='Filters'
            >
              <SearchInput
                type='text'
                id='search-input'
                placeholder='Search...'
                value={searchTerm}
                onChange={(_event, value) => handleSearch(value, filters)}
                aria-label='Search input'
              />
            </ToolbarFilter>
            <Button onClick={addToFilters}>Add Filter</Button>
          </ToolbarGroup>
          <ToolbarItem>
            <Button onClick={loadMessages}>Refresh</Button>
          </ToolbarItem>
          <ToolbarItem>
            <ForwardMessagesModal enabled={selected.length > 0} onForwardMessages={forwardMessages} />
          </ToolbarItem>
          <ToolbarItem variant='pagination'>
            <MessagesPagination />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      {filteredMessages.length > 0 ? (
        <FormGroup>
          <TableComposable aria-label='Message Table' variant='compact' height='80vh'>
            <Thead>
              <Tr>
                <Th
                  select={{
                    onSelect: (_event, isSelecting) => {
                      onSelectAll(isSelecting)
                    },
                    isSelected: isAllSelected(),
                  }}
                />
                <Th>Message ID</Th>
                <Th>Body</Th>
              </Tr>
            </Thead>
            <Tbody>
              {getPage().map((m, index) => {
                return (
                  <Tr key={index}>
                    <Td
                      style={{ flex: 1 }}
                      select={{
                        rowIndex: index,
                        onSelect: (_event, isSelected) => {
                          onSelect(m.messageId, isSelected)
                        },
                        isSelected: selected.includes(m.messageId),
                      }}
                    />
                    <Td style={{ width: '20%' }}>
                      <MessageDetails
                        message={m}
                        mid={m.messageId}
                        index={getFromIndex() + index}
                        getMessage={handleNextMessage}
                        forwardMessages={forwardMessages}
                        maxValue={filteredMessages.length}
                      />
                    </Td>
                    <Td style={{ flex: 3 }}>{getSubstring(m.body)}</Td>
                  </Tr>
                )
              })}
            </Tbody>
          </TableComposable>
        </FormGroup>
      ) : (
        <Bullseye>
          <EmptyState>
            <EmptyStateIcon icon={SearchIcon} />
            <EmptyStateBody>No results found.</EmptyStateBody>
          </EmptyState>
        </Bullseye>
      )}
    </PageSection>
  )
  // )
}